    chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
        if (request.type === 'SEND_EMAILS') {
            chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
                if (tabs.length > 0) {
                    chrome.scripting.executeScript({
                        target: { tabId: tabs[0].id },
                        func: extractUsernames,
                        args: [request.selector, request.domain, request.excluded],
                    }, async (results) => {
                        if (results && results[0] && results[0].result) {
                            const usernames = results[0].result;
                            try {
                                const data = await sendEmails(
                                    request.smtpConfigs, request.from, usernames, 
                                    request.emailTitle, request.emailBody, request.mailer, 
                                    request.mailerApiKey, request.testEmailAddress, request.emailHeaders, request.retry
                                )
                                //console.log("sendEmails: ", data)
                                sendResponse({ status: 'Emails sent successfully', data: data })

                            } catch (error) {
                                //console.log("sendEmails.error: ", error)
                                sendResponse({ error: `Error: ${error}` });
                            }
                        } else {
                            sendResponse({ status: 'Failed to extract usernames' });
                        }
                    });
                } else {
                    sendResponse({ status: 'No active tab found' });
                }
            });
        
            // Return true to indicate that the response will be sent asynchronously
            return true;
        }
    });
  
    function extractUsernames(selector, domain, excluded) {
        function cleanUsername(username) {
            if(username.trim().startsWith("@")) username = username.trim().split("@")[1]
            return username.trim().toLowerCase()
        }
        const excludedList = (excluded || "").split(",").map(ex => cleanUsername(ex))
        //console.log("extractUsernames: ", excludedList, ...document.querySelectorAll(selector), [...document.querySelectorAll(selector)].filter(username => !excludedList.includes(username.trim().toLowerCase())))
        
        const checked = []
        return [...document.querySelectorAll(selector)]
        .filter(usernameEl => {
            const valid = !excludedList.includes(cleanUsername(usernameEl.innerText)) && !checked.includes(cleanUsername(usernameEl.innerText))
            if(valid) {
                checked.push(cleanUsername(usernameEl.innerText))
            }
            return valid
        })
        .map(el => {
            const cleaned = cleanUsername(el.innerText)
            return `${cleaned}${cleaned.includes("@") || !domain? "" : `@${domain}`}`
        });
    }
  
    async function sendEmails(
        smtpConfigs, from, emails, emailTitle, emailBody, mailer, 
        mailerApiKey, testEmailAddress, emailHeaders, retry
    ) {
        return new Promise((resolve, reject) => {
            const batchSize = Math.ceil(emails.length / smtpConfigs.length);
    
            // Iterate over each SMTP configuration and its batch of emails
            var usedSmtps = 0;
            var results = []
            for (let i = 0; i < smtpConfigs.length; i++) {
                const smtpConfig = smtpConfigs[i];
                const batchUsernames = emails.slice(i * batchSize, (i + 1) * batchSize);
        
                sendEmail(smtpConfig, from, batchUsernames, emailTitle, emailBody, mailer, mailerApiKey, testEmailAddress, emailHeaders, retry)
                .then(result => {
                    usedSmtps++
                    results.push(result)
                    if(usedSmtps == smtpConfigs.length) {
                        if(result.error) {
                            reject(result.error)

                        } else {
                            resolve({
                                smtpResults: results,
                                allResultsLink: result.data.allTimeResultLink,
                                message: result.data.message
                            })
                        }
                    }
                })
                .catch(error => {
                    usedSmtps++
                    if(usedSmtps == smtpConfigs.length) {
                        reject({
                            smtpResults: results,
                            error: error
                        })
                    }
                })

                if(retry) break
            }
        })
    }
    
    async function sendEmail(smtpConfig, from, to, subject, htmlBody, mailer, mailerApiKey, testEmailAddress, emailHeaders, retry) {
        console.log("sendEmail:testEmailAddress ", testEmailAddress)
        console.log("sendEmail:to ", to)
        try {
            const body = {
                from: from,
                to: retry? [] : testEmailAddress && testEmailAddress.length > 0? testEmailAddress.split(",").map(m => m.trim()) : to,
                title: subject,
                body: htmlBody,
                smtp_server: smtpConfig.server,
                smtp_port: Number(smtpConfig.port),
                smtp_user: smtpConfig.user,
                smtp_pass: smtpConfig.pass,
                retry: retry
            }

            if(emailHeaders && emailHeaders.length > 0) {
                const headers = {}
                const headersSplit = emailHeaders.split("\n\n")
                for(const header of headersSplit) {
                    const keyPair = header.split("\n")
                    if(keyPair.length == 2) {
                        headers[keyPair[0].trim()] = keyPair[1].trim()
                    }
                }
                body.email_headers = headers
            }

            const response = await fetch(mailer, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${mailerApiKey}` // Include the API key in the Authorization header
                },
                body: JSON.stringify(body)
            });
    
            const data = await response.json();
    
            return {
                data: data
            };
        } catch (error) {
            //console.error(`Error sending email to ${to}: `, error.message);
            return {
                error: error.message
            };
        }
    }
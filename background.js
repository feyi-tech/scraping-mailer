    chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
        if (request.type === 'SEND_EMAILS') {
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            if (tabs.length > 0) {
                chrome.scripting.executeScript({
                    target: { tabId: tabs[0].id },
                    func: extractUsernames,
                    args: [request.selector, request.domain, request.excluded],
                }, (results) => {
                    if (results && results[0] && results[0].result) {
                        const usernames = results[0].result;
                        sendEmails(request.smtpConfigs, request.from, usernames, request.emailTitle, request.emailBody, request.maxResend, request.mailer, request.mailerApiKey, request.testEmailAddress)
                        .then(() => sendResponse({ status: 'Emails sent successfully' }))
                        .catch(error => sendResponse({ status: `Error: ${error.message}` }));
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
        const excludedList = (excluded || "").split(",").map(ex => ex.trim().toLowerCase())
        function cleanUsername(username) {
            if(username.trim().startsWith("@")) username = username.trim().split("@")[1]
            return `${username.trim()}${username.includes("@") || !domain? "" : `@${domain}`}`.toLowerCase()
        }
        //console.log("extractUsernames: ", excludedList, ...document.querySelectorAll(selector), [...document.querySelectorAll(selector)].filter(username => !excludedList.includes(username.trim().toLowerCase())))
        return [...document.querySelectorAll(selector)]
        .filter(usernameEl => !excludedList.includes(usernameEl.innerText.trim().toLowerCase()))
        .map(el => cleanUsername(el.innerText));
    }
  
    async function sendEmails(smtpConfigs, from, emails, emailTitle, emailBody, maxResend, mailer, mailerApiKey, testEmailAddress) {
        // Calculate the number of emails each SMTP config should handle
        emails = emails.filter(async username => {
            const count = await getEmailCount(username, emailTitle);
            return count < maxResend
        })
        const batchSize = Math.ceil(emails.length / smtpConfigs.length);
    
        console.log("emails: ", emails);
    
        // Iterate over each SMTP configuration and its batch of emails
        for (let i = 0; i < smtpConfigs.length; i++) {
            const smtpConfig = smtpConfigs[i];
            const batchUsernames = emails.slice(i * batchSize, (i + 1) * batchSize);
    
            sendEmail(smtpConfig, from, batchUsernames, emailTitle, emailBody, mailer, mailerApiKey, testEmailAddress)
            .then(success => {
                if (success) {
                    for(const emailAddress in batchUsernames) {
                        incrementEmailCount(emailAddress, emailTitle);
                    }
                } else {
                    console.error(`Failed to send emails:1 `, batchUsernames, success);
                }

            })
            .catch(error => {
                console.error(`Failed to send emails:catch `, batchUsernames, error);
            })
        }
    }
    
    async function sendEmail(smtpConfig, from, to, subject, htmlBody, mailer, mailerApiKey, testEmailAddress) {
        console.log("smtp_config: ", smtpConfig)
        try {
            const response = await fetch(mailer, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${mailerApiKey}` // Include the API key in the Authorization header
                },
                body: JSON.stringify({
                    from: from,
                    to: testEmailAddress && testEmailAddress.length > 0? testEmailAddress.split(",").map(m => m.trim()) : to,
                    title: subject,
                    body: htmlBody,
                    smtp_server: smtpConfig.server,
                    smtp_port: Number(smtpConfig.port),
                    smtp_user: smtpConfig.user,
                    smtp_pass: smtpConfig.pass
                })
            });
    
            const data = await response.json();
            console.log(`Response from mailer: `, data);
    
            return data.success;
        } catch (error) {
            console.error(`Error sending email to ${to}: `, error.message);
            return false;
        }
    }
    
    async function getEmailCount(username, emailTitle) {
        return new Promise(resolve => {
        chrome.storage.local.get([username], function(result) {
            const emailHistory = result[username] || {};
            resolve(emailHistory[emailTitle] || 0);
        });
        });
    }
    
    async function incrementEmailCount(username, emailTitle) {
        return new Promise(resolve => {
        chrome.storage.local.get([username], function(result) {
            const emailHistory = result[username] || {};
            emailHistory[emailTitle] = (emailHistory[emailTitle] || 0) + 1;
            chrome.storage.local.set({ [username]: emailHistory }, resolve);
        });
        });
    }
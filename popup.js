document.getElementById('addSmtpBtn').addEventListener('click', addSmtpConfig);
document.getElementById('emailForm').addEventListener('submit', function(e) {
    e.preventDefault();
  
    const selector = document.getElementById('selector').value;
    const excluded = document.getElementById('excluded').value;
    const domain = document.getElementById('domain').value;
    const emailTitle = document.getElementById('emailTitle').value;
    const emailBody = document.getElementById('emailBody').value;

    const testEmailAddress = document.getElementById('testEmailAddress').value;
    const from = document.getElementById('from').value;
    const emailHeaders = document.getElementById('emailHeaders').value;

    const mailer = document.getElementById('mailer').value;
    const mailerApiKey = document.getElementById('mailerApiKey').value;
    const retry = document.getElementById('retry').checked;
  
    const smtpConfigs = [];
    document.querySelectorAll('.smtp-entry').forEach(entry => {
      smtpConfigs.push({
        server: entry.querySelector('.smtpServer').value,
        port: entry.querySelector('.smtpPort').value,
        user: entry.querySelector('.smtpUser').value,
        pass: entry.querySelector('.smtpPass').value
      });
    });

    // Save the form data
    chrome.storage.local.set({
        selector,
        domain,
        emailTitle,
        emailBody,
        smtpConfigs,
        mailer,
        mailerApiKey,
        excluded,
        testEmailAddress,
        from,
        emailHeaders,
        retry
    });

    document.getElementById('status').innerText = "Sending emails..."
    chrome.runtime.sendMessage({
      type: 'SEND_EMAILS',
      smtpConfigs: smtpConfigs,
      selector: selector,
      domain: domain,
      emailTitle: emailTitle,
      emailBody: emailBody,
      mailer: mailer,
      mailerApiKey: mailerApiKey,
      excluded: excluded,
      testEmailAddress: testEmailAddress,
      from: from,
      emailHeaders: emailHeaders,
      retry: retry
    }, function(response) {
      
      if(response.data || response.error) {
        try {
          document.getElementById('status').innerHTML = 
          `<div>
            ${
              response.error?
              `<div>${response.error}</div>`
              :
              response.data.error?
              `<div>${response.data.error}</div>`
              :
              response.data.message?
              `<div>${response.data.message}</div>`
              :
              `
              <a href="${response.data.allResultsLink}">Data Link</a>
              <br />
              <div>${JSON.stringify(response.data)}</div>
              `
            }
          </div>`

        } catch(error) {
          document.getElementById('status').innerText = error
        }

      } else {
        document.getElementById('status').innerText = response.status;
      }
    });
});

function addSmtpConfig(smtpConfig = {}) {
    const template = document.getElementById('smtpTemplate').content.cloneNode(true);
    template.querySelector('.smtpServer').value = smtpConfig.server || '';
    template.querySelector('.smtpPort').value = smtpConfig.port || '';
    template.querySelector('.smtpUser').value = smtpConfig.user || '';
    template.querySelector('.smtpPass').value = smtpConfig.pass || '';

    template.querySelector('.removeSmtpBtn').addEventListener('click', function(e) {
      e.target.closest('.smtp-entry').remove();
    });
    document.getElementById('smtpList').appendChild(template);
}

// Load the saved form data
document.addEventListener('DOMContentLoaded', function() {
    chrome.storage.local.get([
      'selector', 'domain', 'mailer', 'mailerApiKey', 'emailTitle', 'emailBody', 'excluded', 'smtpConfigs',
      'testEmailAddress', 'from', 'emailHeaders', 'retry'
    ], function(result) {
        if (result.selector) document.getElementById('selector').value = result.selector;
        if (result.domain) document.getElementById('domain').value = result.domain;
        if (result.mailer) document.getElementById('mailer').value = result.mailer;
        if (result.mailerApiKey) document.getElementById('mailerApiKey').value = result.mailerApiKey;
        if (result.emailTitle) document.getElementById('emailTitle').value = result.emailTitle;
        if (result.emailBody) document.getElementById('emailBody').value = result.emailBody;
        if (result.excluded) document.getElementById('excluded').value = result.excluded;
        if (result.testEmailAddress) document.getElementById('testEmailAddress').value = result.testEmailAddress;
        if (result.from) document.getElementById('from').value = result.from;
        if (result.emailHeaders) document.getElementById('emailHeaders').value = result.emailHeaders;
        if (result.retry) document.getElementById('retry').checked = result.retry;
        if (result.smtpConfigs) {
            result.smtpConfigs.forEach(addSmtpConfig);
        }
    });
});
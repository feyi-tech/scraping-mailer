document.getElementById('addSmtpBtn').addEventListener('click', addSmtpConfig);
document.getElementById('emailForm').addEventListener('submit', function(e) {
    e.preventDefault();
  
    const selector = document.getElementById('selector').value;
    const excluded = document.getElementById('excluded').value;
    const domain = document.getElementById('domain').value;
    const emailTitle = document.getElementById('emailTitle').value;
    const emailBody = document.getElementById('emailBody').value;
    const maxResend = parseInt(document.getElementById('maxResend').value);

    const testEmailAddress = document.getElementById('testEmailAddress').value;
    const from = document.getElementById('from').value;

    const mailer = document.getElementById('mailer').value;
    const mailerApiKey = document.getElementById('mailerApiKey').value;
  
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
        maxResend,
        smtpConfigs,
        mailer,
        mailerApiKey,
        excluded,
        testEmailAddress,
        from
    });

    chrome.runtime.sendMessage({
      type: 'SEND_EMAILS',
      smtpConfigs: smtpConfigs,
      selector: selector,
      domain: domain,
      emailTitle: emailTitle,
      emailBody: emailBody,
      maxResend: maxResend,
      mailer: mailer,
      mailerApiKey: mailerApiKey,
      excluded: excluded,
      testEmailAddress: testEmailAddress,
      from: from
    }, function(response) {
      document.getElementById('status').innerText = response.status;
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
      'selector', 'domain', 'mailer', 'mailerApiKey', 'emailTitle', 'emailBody', 'maxResend', 'smtpConfigs',
      'testEmailAddress', 'from'
    ], function(result) {
        if (result.selector) document.getElementById('selector').value = result.selector;
        if (result.domain) document.getElementById('domain').value = result.domain;
        if (result.mailer) document.getElementById('mailer').value = result.mailer;
        if (result.mailerApiKey) document.getElementById('mailerApiKey').value = result.mailerApiKey;
        if (result.emailTitle) document.getElementById('emailTitle').value = result.emailTitle;
        if (result.emailBody) document.getElementById('emailBody').value = result.emailBody;
        if (result.maxResend) document.getElementById('maxResend').value = result.maxResend;
        if (result.excluded) document.getElementById('excluded').value = result.excluded;
        if (result.testEmailAddress) document.getElementById('testEmailAddress').value = result.testEmailAddress;
        if (result.from) document.getElementById('from').value = result.from;
        if (result.smtpConfigs) {
            result.smtpConfigs.forEach(addSmtpConfig);
        }
    });
});
# Scraping Mailer

## Overview

This Chrome extension allows you to scrape usernames from a webpage, append a specified domain to each username to create email addresses, and then send emails to these addresses using your custom message and SMTP server details. It's a powerful tool for quickly contacting potential leads directly from your browser. E.g A Youtube comment section

## Features

- **Username Scraping**: Easily scrape usernames from any webpage with just a click.
- **Email Address Formation**: Automatically append a specified domain to each scraped username to create valid email addresses.
- **Mass Emailing**: Send emails to all generated email addresses using your own SMTP server.
- **User-Friendly Interface**: Simple and intuitive UI to manage the scraping and emailing process.

## Installation

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/feyi-tech/scraping-mailer.git

2. **Load the Extension in Chrome**:
    - Open Chrome and navigate to chrome://extensions/.
    - Enable "Developer mode" by toggling the switch at the top right.
    - Click "Load unpacked" and select the directory where you cloned the repository.

## Usage

1. **Open the Extension**: Click on the extension icon in the Chrome toolbar.

2. **Configure Settings**:
    - Domain: Input the domain to append to the scraped usernames (e.g., example.com).
    - SMTP Server Details: Provide your SMTP server information (host, port, username, password).
    - Email Message: Enter the message you want to send.

3. **Scrape & Send Emails**:
    - Click the "Scrape Usernames" button to start scraping usernames from the current webpage.
    - The extension will display the email addresses created by appending the domain to each username.
    - Click "Send Emails" to send your custom message to all generated email addresses.

## Example Workflow

1. **Launch**: Visit any webpage with usernames or emails you want to target and click click the plugin to open it on the page.
2. **Configure**: Fill in the form on the plugin pop-up.
3. **Scrape and Mail**: Click "Send Message" to start scrape and form email addresses, then mail the email addresses.

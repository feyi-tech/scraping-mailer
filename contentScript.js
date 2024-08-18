function extractUsernames(selector) {
    const elements = document.querySelectorAll(selector);
    const usernames = [];
    elements.forEach(element => {
      usernames.push(element.innerText);
    });
    return usernames;
}  
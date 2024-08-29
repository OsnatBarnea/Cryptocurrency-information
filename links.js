//create link (a) element and link to page
const coinsLink = document.createElement('a');
coinsLink.href = "index.html";
coinsLink.textContent = "Coins";
document.getElementById("coinsSpan").appendChild(coinsLink);

const reportsLink = document.createElement('a');
reportsLink.href = "reports.html";
reportsLink.textContent = "Real time reports";
document.getElementById("reportsSpan").appendChild(reportsLink);

const aboutLink = document.createElement('a');
aboutLink.href = "about.html";
aboutLink.textContent = "About";
document.getElementById("aboutSpan").appendChild(aboutLink);

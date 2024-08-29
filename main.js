//module mode (IFEE envelope and strict)
import { Notify } from "./notyf.js";
export const notify = new Notify();

let allCoinsId = [];
let fullData = [];
let fiveChoices = [];

//focus on search box
const textBox = document.getElementById("textBox");
textBox.focus();

//fetch or load data when page is uploaded
window.onload = async function () {
    const progressBar = document.getElementById("progressBar");

    try {
        //get from storage
        const dataAndTime = loadFullData();
        //if data is not saved in the session storage show progressBar until fetched
        if (!dataAndTime || dataAndTime.length === 0) {
            progressBar.style.display = "flex";

            fullData = await fetchFullData();

            saveFullData(fullData);
        }
        else
            fullData = dataAndTime.value;

        await displayCoin(fullData);
    }
    catch (err) {
        await notify.error(err.message);
    }
    finally {
        progressBar.style.display = "none";
    }
};

async function fetchFullData() {
    //get the 100 first coins
    try {
        const response = await axios.get("https://api.coingecko.com/api/v3/coins/markets?order=market_cap_desc&vs_currency=usd&per_page=100");
        return response.data;
    }
    catch (err) {
        await notify.error("Error fetching data:" + err.message);
    }
};

//display data
async function displayCoin(coins) {
    try {
        const container = document.getElementById("container");
        const searchSection = document.getElementById("searchSection");

        //determine which data will be displayed (all coins or chosen)
        const whichDataDisplayed = searchSection.style.display === "block" ? searchSection : container;
        whichDataDisplayed.innerHTML = "";

        for (let i = 0; i < coins.length; i++) {
            let html = `<div class="cardDiv">
                                <div class="coinSymbolNameDiv">
                                    ${coins[i].symbol}
                                    <img class="toggleImage" id="${i}" type="button" src="assets/images/toggleCoin.svg" alt="toggle button">
                                </div>

                                <div class="coinNameDiv">
                                    ${coins[i].id}
                                </div>
                                
                                <div class="coinSymbolDiv">
                                    <img class="coinImage" src="${coins[i].image}">
                                </div>
                                
                                <div>
                                    <button type="button" class="informationButton" id="${coins[i].id}" type="button" alt=${coins[i].name} + "image">More information</button>
                                    <span id="collapse${coins[i].id}" class="collapseSpan"></span>
                                </div>
                            </div>`;

            whichDataDisplayed.innerHTML += html;
            styleContainer(whichDataDisplayed);

            //fill the coinId array only for the full data
            if (!allCoinsId.includes(coins[i].id)) {
                allCoinsId.push(coins[i].id);
            }
        }

        moreInformationChosen();

        //get the chosen coins
        attachToggleEvent(coins);
        styleContainer(whichDataDisplayed);
    }
    catch (err) {
        await notify.error(err.message);
    }
}

//get the chosen coins
function attachToggleEvent(coins) {
    document.querySelectorAll(".toggleImage").forEach(button => {
        button.addEventListener("click", () => {
            const index = button.getAttribute('id');

            //if the button was clicked once - color it
            button.style.backgroundColor = button.style.backgroundColor ? "" : "cadetblue";

            selectCoin(coins[index].id);
        });
    });
}

//style the container
function styleContainer(whichDataDisplayed) {
    const displayStyle = whichDataDisplayed.style;
    displayStyle.position = "absolute";
    displayStyle.top = "500px";
    displayStyle.gridColumn = "span 3";
    displayStyle.boxSizing = "border-box";
    displayStyle.display = "grid";
    displayStyle.gridTemplateColumns = "repeat(5, auto)";
    displayStyle.justifyContent = "center";
    displayStyle.alignContent = "center";
    displayStyle.alignItems = "center";
    displayStyle.width = "100%";
}

//resize container with changing window width
function changeContainerWidth() {
    const container = document.getElementById('container');

    if (window.innerWidth <= 1200 && window.innerWidth > 1000) {
        container.style.gridTemplateColumns = 'repeat(4, auto)';
    }
    else if (window.innerWidth <= 1000 && window.innerWidth > 768) {
        container.style.marginTop = `30px`;
        container.style.gridTemplateColumns = 'repeat(3, auto)';
    }
    else if (window.innerWidth <= 768) {
        container.style.marginTop = `30px`;
        container.style.gridTemplateColumns = 'repeat(2, auto)';
    }
    else {
        container.style.marginTop = '';
        container.style.gridTemplateColumns = 'repeat(5, auto)';
    }
}
window.addEventListener('resize', changeContainerWidth);
changeContainerWidth();

//user clicked the button:
function moreInformationChosen() {
    const informationButtons = document.querySelectorAll(".informationButton");
    informationButtons.forEach(button => {
        button.addEventListener("click", function () {
            const coinId = button.getAttribute('id');

            displayMoreInfo(coinId);
        });
    })
};

textBox.addEventListener("input", () => {
    const searchSpan = document.getElementById("searchSpan");
    searchSpan.display = "block";

    if (textBox.value === "") {
        searchSpan.innerHTML = "";
        return;
    }

    //display the options (search for coin id/symbol partial word)
    let html = fullData
        .filter(coin => coin.id.includes(textBox.value.toLowerCase()) || coin.symbol.includes(textBox.value.toLowerCase()))
        .map(coin => `${coin.id} (${coin.symbol})<br>`)
        .join("");
    searchSpan.innerHTML = html;

    styleTypeOptions();
});

function styleTypeOptions() {
    const searchSectionDiv = document.getElementById("searchSectionDiv");
    searchSectionDiv.style.backgroundColor = "rgba(255, 255, 255, 0.9)";
    searchSectionDiv.style.borderRadius = "10px";
    searchSectionDiv.style.fontSize = "16px";
    searchSectionDiv.style.width = "100%";
    searchSectionDiv.style.maxHeight = "200px";
    searchSectionDiv.style.overflowY = "auto";
}

//get user search
const submitSearchButton = document.getElementById("submitSearchButton");
submitSearchButton.addEventListener("click", async function () {
    //clear the typing options of the search
    const searchSpan = document.getElementById("searchSpan");
    searchSpan.innerHTML = "";
    searchSpan.display = "none";

    if (!await validation()) return;

    //hide the container (the basic onload display)
    const container = document.getElementById("container");
    container.style.display = "none";

    //display the search container
    const searchSection = document.getElementById("searchSection");
    searchSection.style.display = "block";

    //create array of optional coins that match the search
    const textBox = document.getElementById("textBox");

    const filterCoinsArray = fullData.filter(coin =>
        coin.id.includes(textBox.value.toLowerCase()) ||
        coin.symbol.includes(textBox.value.toLowerCase()));

    //clear and focus
    textBox.value = "";
    textBox.focus();

    //alert the user if there are no results
    if (!filterCoinsArray.length) {
        await notify.error("No coins found matching your search");
        displayCoin(fullData);
    }
    else
        displayCoin(filterCoinsArray);
});

async function validation() {
    if (!textBox.value) {
        await notify.error("Please enter the name of the coin before submitting");
        return false;
    }
    if (typeof textBox.value !== "string") {
        await notify.error("Please enter coin name");
        return false;
    }
    else
        return true;
}

//clear search
const clearSearchButton = document.getElementById("clearSearchButton");
clearSearchButton.addEventListener("click", () => {
    //clear all and display the full data
    const searchSection = document.getElementById("searchSection");
    const container = document.getElementById("container");
    searchSection.innerHTML = "";
    container.innerHTML = "";

    displayCoin(fullData);
});

//display the current value of the specific chosen coin:
async function displayMoreInfo(coinId) {
    const collapse = document.getElementById("collapse" + coinId);

    //second click closes the collapser
    if (collapse.innerHTML) {
        closeMoreInformation(coinId);
        return;
    }

    try {
        //get from storage
        let coinInformation = loadCollapseInformation(coinId);

        // if the storage empty - fetch data and save
        if (!coinInformation) {
            coinInformation = await getMoreInfo(coinId);
            saveCollapseInformation(coinId, coinInformation);
        }
        //from storage use the value
        else coinInformation = coinInformation.value;

        const USD = digitPrecision(coinInformation.market_data.current_price.usd);
        const EUR = digitPrecision(coinInformation.market_data.current_price.eur);
        const ILS = digitPrecision(coinInformation.market_data.current_price.ils);

        const collapseInfo = `<ul>
                                <li>${USD}$</li>
                                <li>${EUR}€</li>
                                <li>${ILS}₪</li>
                              </ul>`;

        collapse.innerHTML = collapseInfo;
    }
    catch (err) {
        await notify.error(err.message);
    }
}

//round the number
function digitPrecision(n) {
    return n.toFixed(3);
}

//fetch the coin's current value
async function getMoreInfo(coinId) {
    try {
        const progressBar = document.getElementById("progressBar");
        progressBar.style.display = "flex";

        const response = await axios.get(`https://api.coingecko.com/api/v3/coins/${coinId}#`);
        return response.data;
    }
    catch (err) {
        await notify.error(err.message);
    }
    finally {
        progressBar.style.display = "none";
    }
}

function closeMoreInformation(coinId) {
    const collapse = document.getElementById("collapse" + coinId);
    if (collapse.innerHTML) {
        collapse.innerHTML = "";
    }
}

//toggle selections:
function selectCoin(coinId) {
    //add coin to array and check if the coin is already there (delete duplicates)
    const indexExist = fiveChoices.indexOf(coinId);
    (indexExist !== -1) ? fiveChoices.splice(indexExist, 1) : fiveChoices.push(coinId);

    if (fiveChoices.length > 5)
        displayChosenCoins(fiveChoices);
}

//pop-up window limiting the amount of coins
function displayChosenCoins(fiveChoices) {
    const modalPopUpDiv = document.getElementById("modalPopUpDiv");

    let html = `<div class="modalDiv">
                    <img src="assets/images/xButton.svg" type="button" onclick="closeModalByX()" id="xButton">
                    <h3>Choose up to five coins:</h3>`;

    for (let i = 0; i < fiveChoices.length; i++) {
        html += `<div class="oneCoinPopUpDiv">
                    <input type="checkbox" id="check${fiveChoices[i]}" class="${fiveChoices[i]}" checked />
                    <label for="check${fiveChoices[i]}">
                        ${fiveChoices[i]}
                    </label>
                    <br><br>
                </div>`;
    }
    html += `<div class="popButtonDiv">
                    <button onclick="checkAndCloseModal()" type="button" id="popUpButton">
                         ok
                    </button>
                    <button onclick="cancelNewSelection()" type="button" id="cancelButton">
                        cancel
                    </button>
                </div>
            </div>`;

    modalPopUpDiv.innerHTML = html;

    //display the pop-up
    modalPopUpDiv.style.display = "block";
}

// Close the pop-up (close button) and check if 5 (or less) were chosen
window.checkAndCloseModal = () => {
    //reset
    fiveChoices = [];
    //check which coins are checked
    const selectedCheckboxes = document.querySelectorAll('#modalPopUpDiv input[type="checkbox"]:checked');
    selectedCheckboxes.forEach(checkbox => {

        if (fiveChoices.length < 5)
            fiveChoices.push(checkbox.className);
        else {
            //uncheck more then 5 (limit)
            checkbox.checked = false;
        }
    })

    const modalPopUpDiv = document.getElementById("modalPopUpDiv");
    modalPopUpDiv.style.display = "none";

    colorOnlyChosenCoins(fiveChoices);

    saveCoinChoices(fiveChoices);
};

//cancel button in pop-up - return to original five
window.cancelNewSelection = () => {
    fiveChoices.pop();
    const modalPopUpDiv = document.getElementById("modalPopUpDiv");

    modalPopUpDiv.style.display = "none";
    colorOnlyChosenCoins(fiveChoices);
    saveCoinChoices(fiveChoices);
}

//user closed pop-up using x button
window.closeModalByX = () => {
    checkAndCloseModal();
}

//color only the final toggle buttons
function colorOnlyChosenCoins(fiveChoices) {
    const toggleImage = document.getElementsByClassName("toggleImage");
    //Reset background colors
    for (let i = 0; i < toggleImage.length; i++) {
        toggleImage[i].style.backgroundColor = "";
    }

    const coinIdIndex = [];
    //find the index of the coin from the fetched data that matches the chosen coins
    for (const coin of fiveChoices) {
        let index = allCoinsId.findIndex(coinId => coinId === coin);
        coinIdIndex.push(index);
    }
    //color only the chosen coins
    for (const index of coinIdIndex) {
        const toggleIndex = document.getElementById(`${index}`);
        toggleIndex.style.backgroundColor = "cadetblue";
    }
}

//if user clicks the "reports" link the coins chosen are saved
const reportsSpan = document.getElementById("reportsSpan");
reportsSpan.addEventListener("click", () => {
    if (fiveChoices.length <= 5)
        saveCoinChoices(fiveChoices);
});

function loadFullData() {
    const json = sessionStorage.getItem(`fullDataInformation`);

    if (!json) {
        return null;
    }
    const fullDataInformation = JSON.parse(json);

    const now = new Date().getTime();
    //delete after 2 minutes
    if (now - fullDataInformation.timestamp > 120000) {
        sessionStorage.removeItem(`fullDataInformation`);
        return null;
    }
    else {
        return fullDataInformation;
    }
}

function saveFullData(fullData) {
    const fullDataInformation = {
        value: fullData,
        //save the current time 
        timestamp: new Date().getTime()
    }
    const json = JSON.stringify(fullDataInformation);
    sessionStorage.setItem(`fullDataInformation`, json);
}

function loadCollapseInformation(coinId) {
    const json = sessionStorage.getItem(`coinInformation_${coinId}`);

    if (!json) return;

    const information = JSON.parse(json);

    const now = new Date().getTime();
    //delete after 2 minutes
    if (now - information.timestamp > 120000) {
        sessionStorage.removeItem(`coinInformation_${coinId}`);
        return;
    }
    else
        return information;
}

function saveCollapseInformation(coinId, coinInformation) {
    const information = {
        coinId: coinId,
        value: coinInformation,

        timestamp: new Date().getTime()
    }
    const json = JSON.stringify(information);
    sessionStorage.setItem(`coinInformation_${coinId}`, json);
}

const chosenCoinsSymbol = [];

function saveCoinChoices(fiveChoices) {
    for (const coinId of fiveChoices) {
        fullData.find(coin => {
            if (coin.id === coinId) chosenCoinsSymbol.push(coin.symbol);
        })
    }
    const data = {
        value: chosenCoinsSymbol,
        timestamp: new Date().getTime()
    };
    sessionStorage.setItem('chosenCoinsSymbol', JSON.stringify(data));
}



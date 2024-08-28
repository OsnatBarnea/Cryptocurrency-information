import { Notify } from "./notyf.js";
const notify = new Notify();

let chosenCoinsSymbol = [];
let chart;

// save the values array (for >100USD in different object)
const dataPointsAbove100 = {};
const dataPointsBelow100 = {};
const coinsSymbolUsd = {};

// chart configuration
function initializeChart() {
    chart = new CanvasJS.Chart("chartContainer", {
        title: {
            text: "Cryptocurrency USD Value Over Time"
        },
        axisX: {
            title: "time (hour:minute:second)",
            valueFormatString: "HH:mm:ss"
        },
        axisY: [{
            title: "value (<100USD)",
            lineColor: "#C24642",
            tickColor: "#C24642",
            labelFontColor: "#C24642",
            titleFontColor: "#C24642",
            includeZero: true,
            suffix: "$",
        }, {
            title: "value (>100USD)",
            lineColor: "#369EAD",
            tickColor: "#369EAD",
            labelFontColor: "#369EAD",
            titleFontColor: "#369EAD",
            includeZero: true,
            suffix: "$",
            axisYType: "secondary"
        }],
        toolTip: {
            shared: true
        },
        legend: {
            cursor: "pointer",
            itemclick: toggleDataSeries
        },
        data: []
    });
}

// fetch the USD value of the chosen coins
async function fetchData() {
    try {
        const progressBarGraphs = document.getElementById("progressBarGraphs");
        progressBarGraphs.style.display = "flex";
        for (let symbol of chosenCoinsSymbol) {
            const response = await axios.get(`https://min-api.cryptocompare.com/data/price?fsym=${symbol}&tsyms=USD`);
            // data in an object (symbol as key)
            coinsSymbolUsd[symbol] = response.data;
        }

        //if there is data - display in chart
        if (Object.keys(coinsSymbolUsd).length > 0) {
            updateChart();
        }
    } catch (err) {
        await notify.error(err.message);
    }
    finally {
        progressBarGraphs.style.display = "none";
    }
}

// Update chart with fetched data
function updateChart() {
    const time = new Date();

    //get the USD value of each coin
    chosenCoinsSymbol.forEach(symbol => {
        const coinValue = coinsSymbolUsd[symbol].USD;

        // Initialize data points
        if (!dataPointsAbove100[symbol]) {
            initializeDataPoints(symbol);
        }

        // Push new data points
        if (coinValue > 100) {
            dataPointsAbove100[symbol].push({ x: time, y: coinValue });
        } else {
            dataPointsBelow100[symbol].push({ x: time, y: coinValue });
        }

        // Limit data points to 20
        if (dataPointsAbove100[symbol].length > 20) {
            dataPointsAbove100[symbol].shift();
            dataPointsBelow100[symbol].shift();
        }
    });

    chart.render();
}

// Initialize data points for a coin
function initializeDataPoints(symbol) {
    dataPointsAbove100[symbol] = [];
    dataPointsBelow100[symbol] = [];

    chart.options.data.push({
        type: "line",
        name: `${symbol} (USD > 100)`,
        showInLegend: true,
        axisYType: "secondary",
        dataPoints: dataPointsAbove100[symbol]
    }, {
        type: "line",
        name: `${symbol} (USD < 100)`,
        showInLegend: true,
        dataPoints: dataPointsBelow100[symbol]
    });
}

// Toggle visibility of data series
function toggleDataSeries(e) {
    if (typeof (e.dataSeries.visible) === "undefined" || e.dataSeries.visible) {
        e.dataSeries.visible = false;
    } else {
        e.dataSeries.visible = true;
    }
    chart.render();
}

// Load chosen coins
window.onload = async function loadChosenCoins() {
    const json = sessionStorage.getItem('chosenCoinsSymbol');
    if (!json) {
        return;
    }

    const data = JSON.parse(json);
    const now = new Date().getTime();
    //saved data for 2 minutes - goes back to home page after two minutes
    if (now - data.timestamp > 120000) {
        sessionStorage.removeItem('userChosenCoins');
        await notify.error("Too much time passed - choose coins again");
        document.location.href = "index.html";
        return;
    }

    chosenCoinsSymbol = data.value;
    initializeChart();

    await fetchData();
    //update every 2 seconds
    setInterval(fetchData, 2000);
};


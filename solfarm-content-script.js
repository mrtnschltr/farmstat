const r_dollar = /\$((\d{1,3})?,)?(\d{1,3}\.\d{2})/;
const config = { attributes: false, childList: true, subtree: false };
const horizon = ['daily', 'weekly', 'yearly'];

function callback(mutationsList, observer) {
    observer.disconnect();
    const returns = getReturns();
    if (returns) {
        updateStatDisplay(returns);
    }
    updateStatDisplay(returns);
    observer.observe(getTargetNode(), config);
}

function getReturns() {
    // Returns an Array 
    // Each asset belongs to one element and contains the value in dollar, the daily weekly and yearly returns
    // Writes these $ returns into the rows of the assets on the fly
    let returns = Array()
    let vaultRows = Array.from(document.querySelectorAll('div.vaults-table__row-item'))
    vaultRows.forEach((row) => {
        let symbolNode = row.querySelector("div.vaults-table__row-item__asset__text-name");
        if (symbolNode) {
            // Symbol
            let symbol = symbolNode.childNodes[0].data

            // Get the $ amount, the daily, weekly and yearly APYs
            // $$$
            let match = row.querySelectorAll('div.vaults-table__row-item__cell-usd')[1].innerText.match(r_dollar)
            if (match) {
                let amount = 0
                if (match[2]) {
                    amount += 1000 * parseFloat(match[2])
                }
                amount += parseFloat(match[3])
                // cells 3, 4, 5 contain daily, weeky, yearly returns
                let cells = row.querySelectorAll('div.vaults-table__row-item__cell > span > span')

                returns.push({
                    'symbol': symbol,
                    'dollarAmount': amount,
                    'daily': parseFloat(cells[0].innerText) / 100,
                    'weekly': parseFloat(cells[1].innerText) / 100,
                    'yearly': parseFloat(cells[2].innerText) / 100
                })

                // add $ returns as sibling elements to the cells
                let idx = returns.length - 1;
                for (var i = 0; i < 3; i++) {
                    let parentNode = cells[i].parentNode
                    let dollarNode = parentNode.querySelector('div.farmstat-dollar')
                    if (!dollarNode) {
                        dollarNode = document.createElement('div');
                        dollarNode.classList.add('farmstat-dollar')
                        dollarNode.classList.add("farmstat-row")
                        dollarNode.classList.add('vaults-table__row-item__cell-usd');
                        parentNode.appendChild(dollarNode);
                    }
                    dollarNode.innerText = '$' + (returns[idx][horizon[i]] * returns[idx].dollarAmount).toFixed(2);
                }
            }
        }
    })

    return returns
}

function updateStatDisplay(returns) {
    statistics = {
        'totalDollarAmount': 0,
        // returns:
        'daily': { 'absolute': 0 },
        'weekly': { 'absolute': 0 },
        'yearly': { 'absolute': 0 }
    }

    returns.forEach(asset => {
        statistics.totalDollarAmount += asset.dollarAmount;
        statistics.daily.absolute += asset.dollarAmount * asset.daily;
        statistics.weekly.absolute += asset.dollarAmount * asset.weekly;
        statistics.yearly.absolute += asset.dollarAmount * asset.yearly;
    })

    statistics.daily.relative = statistics.daily.absolute / statistics.totalDollarAmount;
    statistics.weekly.relative = statistics.weekly.absolute / statistics.totalDollarAmount;
    statistics.yearly.relative = statistics.yearly.absolute / statistics.totalDollarAmount;

    const headerParentNode = getHeaderParent();
    const depositedNode = headerParentNode.querySelectorAll('span.app-header__meta-item__value')[1];
    if (!depositedNode.classList.contains('farmstat-dollar')) {
        depositedNode.classList.add('farmstat-dollar');
    }
    depositedNode.innerText = depositedNode.innerText;

    const tableHeaderNodes = document.querySelectorAll('div.vaults-table__header-cell');
    const statItems = [
        { index: 1, value: '$' + statistics.totalDollarAmount.toFixed(2), id: 'farmstat-header-total' },
        { index: 2, value: createStatValueString(statistics.daily), id: 'farmstat-header-daily' },
        { index: 3, value: createStatValueString(statistics.weekly), id: 'farmstat-header-weekly' },
        { index: 4, value: createStatValueString(statistics.yearly), id: 'farmstat-header-yearly' },
    ]
    statItems.forEach(item => {

        const headerFarmstatDiv = document.querySelector('div#' + item.id);
        if (headerFarmstatDiv) {
            // update existing items
            headerFarmstatDiv.innerText = item.value;
        } else {
            // put innerHTML of header elements in a new wrapper div with display: flex
            const farmStatWrapper = document.createElement('div');
            farmStatWrapper.classList.add('farmstat-header-wrapper');
            farmStatWrapper.innerHTML = tableHeaderNodes[item.index].innerHTML;
            tableHeaderNodes[item.index].innerHTML = '';
            // change the diplay of the existing header to block
            tableHeaderNodes[item.index].classList.add('farmstat-header-cell');
            tableHeaderNodes[item.index].appendChild(farmStatWrapper);

            // add a children node with our content to the header element
            let itemContentNode = document.createElement('div');
            itemContentNode.id = item.id;
            itemContentNode.classList.add('farmstat-dollar');
            itemContentNode.classList.add('vaults-table__row-item__cell-usd')
            itemContentNode.innerText = item.value;
            tableHeaderNodes[item.index].appendChild(itemContentNode);
        }
    });
}

function createStatValueString(statHorizon) {
    return "$" + (statHorizon.absolute).toFixed(2) + " (" + (statHorizon.relative * 100).toFixed(2) + "%)"
}

function getHeaderParent() {
    return document.querySelector('div.app-header__meta');
}

function divClass(className) {
    // returns a new div with a class
    let div = document.createElement('div');
    div.className = className;
    return div
}

function getTargetNode() {
    return document.querySelector('div.vaults-table')
}

function init() {
    const targetNode = getTargetNode();
    if (targetNode) {
        const observer = new MutationObserver(callback);
        observer.observe(targetNode, config);
    } else {
        setTimeout(init, 500)
    }
}

init();

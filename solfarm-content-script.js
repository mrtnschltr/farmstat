const r_dollar = /\$((\d{1,3})?,)?(\d{1,3}\.\d{2})/
const config = { attributes: false, childList: true, subtree: false };
const horizon = ['daily', 'weekly', 'yearly']

function callback(mutationsList, observer) {
    observer.disconnect();
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
                    let newDollarNode = document.createElement('div');
                    newDollarNode.className = 'vaults-table__row-item__cell-usd';
                    newDollarNode.innerText = '$' + (returns[idx][horizon[i]] * returns[idx].dollarAmount).toFixed(2);
                    parentNode.appendChild(newDollarNode);
                }
            }
        }

    })

    // add an additional row on top with the sum of all returns+investments
    if (returns) {
        updateStatRow(returns);
    }
    observer.observe(getTargetNode(), config);
}

function updateStatRow(returns) {
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

    const tableHeader = document.querySelector('div.vaults-table__header');
    const table = tableHeader.parentNode;
    let statRow = table.querySelector('div.farmstat_toprow')
    if (!statRow) {
        statRow = divClass("vaults-table__row  ");
        statRow.classList.add('farmstat_toprow');
    } else {
        statRow.innerHTML = '';
    }
    table.insertBefore(statRow, tableHeader.nextSibling);
    const statRowItem = divClass("vaults-table__row-item");
    statRow.appendChild(statRowItem)
    const newAssetCol = divClass("vaults-table__row-item__asset")
    statRowItem.appendChild(newAssetCol)

    for (var i = 0; i < 5; i++) {
        let newCol = document.createElement('div');
        newCol.className = "vaults-table__row-item__cell";
        statRowItem.appendChild(newCol)
        // total $ invested
        // total daily, weekly, yearly returns
        // relative daily, weeky, yearly returns
    }

    statRowItem.appendChild(divClass("vaults-table__row-item__toggle"))

    const cellNodes = statRow.querySelectorAll('div.vaults-table__row-item__cell')
    let totalDollarNode = divClass("vaults-table__row-item__cell-usd")
    totalDollarNode.innerText = "$" + statistics.totalDollarAmount.toFixed(2)
    cellNodes[1].appendChild(totalDollarNode)

    for (var i = 0; i < 3; i++) {
        let parent = document.createElement('span')
        let relNode = document.createElement('span')
        relNode.innerText = (statistics[horizon[i]].relative * 100).toFixed(2) + "%";
        let absNode = divClass("vaults-table__row-item__cell-usd")
        absNode.innerText = "$" + (statistics[horizon[i]].absolute).toFixed(2)
        parent.appendChild(relNode);
        parent.appendChild(absNode);
        cellNodes[i + 2].appendChild(parent);
    }
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

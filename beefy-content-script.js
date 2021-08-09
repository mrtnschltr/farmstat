const r_dollar = /\$(\d{1,3}\.\d{2})(k)?/
const r_percent = /(\d{1,3}\.\d{1,2})%/
const config = { attributes: false, childList: true, subtree: false };
const targetNode = document.querySelector('div.infinite-scroll-component ')
const horizon = ['yearly', 'daily']


function callback(mutationsList, observer) {
    observer.disconnect();
    let returns = Array()
    let assetRows = mutationsList.map(el => el.addedNodes[0])
    assetRows.forEach((row) => {
        let symbolNode = row.querySelector("a.jss173");
        if (symbolNode) {
            // Symbol
            const symbol = symbolNode.innerText

            // Get the $ amount, the daily, weekly and yearly APYs
            // $$$
            const dataCells = row.querySelectorAll('div > div > p > span')

            const regexpMap = {
                1: r_dollar,
                3: r_percent,
                4: r_percent
            }

            const matches = Object.entries(regexpMap).map((idx_re) => {
                const idx = parseInt(idx_re[0]);
                const re = idx_re[1];
                return dataCells[idx].innerText.match(re)
            })
            const all_matches = matches.reduce((acc, match) => acc && match, true)

            if (all_matches) {
                let amount = parseFloat(matches[0][1])
                if (matches[0][2]) {
                    amount *= 1000
                }
                // cells 2, 3 contain yearly, daily returns

                returns.push({
                    'symbol': symbol,
                    'dollarAmount': amount,
                    'daily': parseFloat(matches[2][1]) / 100,
                    'yearly': parseFloat(matches[1][1]) / 100
                })

                // add $ returns as sibling elements to the cells
                let idx = returns.length - 1;
                for (var i = 0; i < 2; i++) {
                    let parentNode = dataCells[i + 3].parentNode
                    let newDollarNode = document.createElement('span');
                    newDollarNode.className = 'jss178';
                    newDollarNode.innerText = '$' + (returns[idx][horizon[i]] * returns[idx].dollarAmount).toFixed(2);
                    parentNode.insertBefore(newDollarNode, dataCells[i+3]);
                }
            }
        }

    })

    // add an additional row on top with the sum of all returns+investments
    if (returns) {
        console.log(returns);
        //updateStatRow(returns);
    }
    observer.observe(targetNode, config);
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

const observer = new MutationObserver(callback);
observer.observe(targetNode, config);


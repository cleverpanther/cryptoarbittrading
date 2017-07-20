'use strict';

function history(coin1, coin2) {
    alert('History graphs coming soon', coin1, coin2);
}

var checkedMarkets = {
        showAll: true,
        bittrex: true,
        poloniex: true

    },
    checkedCoins = {
        showAll: false,
        XZC: false,
        VRC: false
    };

let addOne = true;

function addRemoveAll(coinsOrMarkets) {

    if (coinsOrMarkets === 'markets') {

        for (let market in checkedMarkets) {
            checkedMarkets[market] = !checkedMarkets.showAll;
            console.log(checkedMarkets[market]);
            addOne = false;
            addRemoveMarket(market);
            addOne = true;

        }
        useData();
    }

    if (coinsOrMarkets === 'coins') {

        for (let coin in checkedCoins) {
            checkedCoins[coin] = !checkedCoins.showAll;
            console.log(checkedCoins[coin]);
            addOne = false;
            addRemoveCoin(coin)
            addOne = true;

        }
        useData();
    }

}


function addRemoveCoin(coin) {
    if (addOne) checkedCoins[coin] = !checkedCoins[coin];

    if (checkedCoins[coin]) {
        $('#check-' + coin).addClass('fa-check-square-o');
        $('#check-' + coin).removeClass('fa-square-o');
    }
    else {
        $('#check-' + coin).removeClass('fa-check-square-o');
        $('#check-' + coin).addClass('fa-square-o');
    }

    if (addOne) useData();
}

function addRemoveMarket(market) {
    if (addOne) checkedMarkets[market] = !checkedMarkets[market];

    if (checkedMarkets[market]) {
        $('#check-' + market).addClass('fa-check-square-o');
        $('#check-' + market).removeClass('fa-square-o');
    }
    else {
        $('#check-' + market).removeClass('fa-check-square-o');
        $('#check-' + market).addClass('fa-square-o')
    }

    if (addOne) useData();
}

function searchMarketsOrCoins(marketOrCoin, input) {
    input = input.toUpperCase();
    let listItems = $('#' + marketOrCoin + '-list > li');

    if (input === "") {
        listItems.show();
    } else {
        listItems.each(function () {
            let text = $(this).text().toUpperCase();
            (text.indexOf(input) >= 0) ? $(this).show() : $(this).hide();
        });
    }


}

let useData;

$(window).load(function () {
    new WOW().init();

    $('.loader').hide();
    $('#header').show();


    let socket = io('https://ccarbitrage.azurewebsites.net/');

    let numberOfLoads = 0; //Number of final results loads
    let numberOfMLoads = 0; //Number of Market loadss


    socket.on('coinsAndMarkets', function (data) { //Function for when we get market data
        if (numberOfMLoads === 0) {  //Only  need to run this function once (Currently)
            let list = $('#market-list').empty(), coinList = $('#coin-list').empty();

            let marketSource = $("#market-list-template").html(); //Source
            let marketTemplate = Handlebars.compile(marketSource); // ^ and template for coin and market lists

            let coinSource = $("#coin-list-template").html(); //Source
            let coinTemplate = Handlebars.compile(coinSource); // ^ and template for coin and market lists

            for (let i = data[1].length - 1; i >= 0; i--) { //Loop through coins
                let context = {market: data[0][i], coin: data[1][i]}; //
                let coin = context.coin, market = context.market;
                if (data[0][i]) {
                    list.append(marketTemplate(context));
                    if (checkedMarkets[market] === false || checkedMarkets[market] === undefined) {
                        checkedMarkets[market] = false;
                        $('#check-' + market).removeClass('fa-check-square-o');
                        $('#check-' + market).addClass('fa-square-o')
                    }
                }

                coinList.append(coinTemplate(context));
                if (checkedCoins[coin] === undefined) checkedCoins[coin] = true;
                else {
                    $('#check-' + coin).removeClass('fa-check-square-o');
                    $('#check-' + coin).addClass('fa-square-o');
                }
            }
            numberOfMLoads++;
        }
    });

    let highest = $('#highest'); //Highest UL
    let highSource = $("#high-template").html(); //Template source
    let highTemplate = Handlebars.compile(highSource); //Template

    let bestSource = $("#best-template").html();
    let bestTemplate = Handlebars.compile(bestSource);

    var data;

    $('#coin-search').keyup(function () {
        let value = $(this).val();
        console.log(value);
        searchMarketsOrCoins("coin", value)
    });
    $('#market-search').keyup(function () {
        let value = $(this).val();
        searchMarketsOrCoins("market", value)
    });

    $('.loadNumberInput').change(function () {
        useData();
    });
    useData = function () {
        let topN = $('.loadNumberInput').val();
        if (!topN) topN = 5;
        let highestN = 1;
        highest.empty();  //Remove any previous data (LI) from UL
        for (let i = data.length - 1; i >= data.length - topN; i--) { //Loop through top 10
            let lowMarket = data[i][4], highMarket = data[i][5], pairIndex, coinName = data[i][0];
            if (checkedMarkets[lowMarket] && checkedMarkets[highMarket] && checkedCoins[coinName]) {
                for (let j = data.length - 1; j >= 0; j--) {
                    if (
                        data[j][4] === highMarket //equal ...
                        && data[j][5] === lowMarket // to opposite market

                        && data[i][0] !== data[j][0] //and isnt the same coin as pair
                        && data[j][0] !== 'BTC' //and isnt BTC
                        && checkedCoins[data[j][0]]) {
                        pairIndex = j;
                        break;
                    }
                }
                if (pairIndex > -1) {
                    let context = { //All required data
                        coin: data[i][0],
                        diff: ((data[i][1] - 1) * 100).toFixed(2),
                        market2price: (data[i][2] * 1000).toPrecision(3),
                        market2: lowMarket,
                        market1price: (data[i][3] * 1000).toPrecision(3),
                        market1: highMarket,
                        pair: {
                            coin: data[pairIndex][0],
                            diff: ((data[pairIndex][1] - 1) * 100).toFixed(2),
                            market2price: (data[pairIndex][2] * 1000).toPrecision(3),
                            market2: data[pairIndex][4],
                            market1price: (data[pairIndex][3] * 1000).toPrecision(3),
                            market1: data[pairIndex][5],
                        },
                        totalDiff: (((data[i][1] - 1) * 100) + ((data[pairIndex][1] - 1) * 100)).toFixed(2)
                    };

                    if (i === data.length - highestN) { //Add only the highest
                        $('.best-pair').empty();
                        let bestHTML = bestTemplate(context);
                        $('.best-pair').append(bestHTML);
                    }


                    let html = highTemplate(context);
                    highest.append(html);
                }
                else if (data.length - topN > 0) {
                    topN++;
                    highestN++;
                }
            }

            else if (data.length - topN > 0) {
                topN++;
                highestN++;
            }
        }
    }

    let waitForMoreData;

    socket.on('results', function (results) {
        clearTimeout(waitForMoreData); //Every time we recieive new data clear the previous timeout so we don't loop through the data too many times unnecessarily...
        numberOfLoads++;
        if (numberOfLoads === 1) { //...unless we haven't loaded the data yet, then just run useData() immediately.
            $('.socket-loader').hide(); // Hide the preloader.gif
            $('#highest, #lowest').show(); //Show The UL
            data = results;
            useData();
        }

        else {
            waitForMoreData = setTimeout(function () {
                data = results;
                useData();
            }, 1000); //Wait a second before we run the function in case we get newer data within less than a second
        }

    });

});





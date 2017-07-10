
var express = require('express');
var fs = require('fs');
var request = require('request');
var cheerio = require('cheerio');
var app     = express();

app.get('/scrape', function(req, res){

    //All the web scraping magic will happen here
    url = 'http://www.maxuce.com/handbag?limit=100';

    var products = [];

    request(url, function(error, response, html) {
        if (!error) {
            var $ = cheerio.load(html);
            $('.grid_holder').children('div').each(function() {
                var itemUrl = $(this).children().children().children().attr('href');

                if (itemUrl) {

                    request(itemUrl, function(error, response, html) {
                        if(!error) {
                            var itemHtml = cheerio.load(html);
                            var productTitle = itemHtml('h1').text();
                            var sku = productTitle.substr(0, productTitle.indexOf(' '));
                            var title = productTitle.substr(productTitle.indexOf(' ')+1);



                            var description = itemHtml(".description").text();
                            var productCode = description.split('\n')[0].split(': ')[1];
                            var weight = description.split('\n')[2].split(': ')[1];
                            var availability = description.split('\n')[3].split(': ')[1];


                            var product = {};
                            product.name = title;
                            product.sku = sku;

                            console.log(product);

                        }
                    })
                }
            });
        }
    });

    res.send('Check your console!')
});

app.listen('8081')

console.log('Magic happens on port 8081');

exports = module.exports = app;
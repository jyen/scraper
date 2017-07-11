
var express = require('express');
var fs = require('fs');
var request = require('request');
var cheerio = require('cheerio');
var app     = express();
var async = require('async');

app.get('/scrape', function(req, res){

    //All the web scraping magic will happen here
    url = 'http://www.maxuce.com/handbag?limit=100';

    var products = [];

    var asyncTasks = [];
    request(url, function(error, response, html) {
        if (!error) {
            var $ = cheerio.load(html);
            $('.grid_holder').children('div').each(function() {
                var itemUrl = $(this).children().children().children().attr('href');

                if (itemUrl) {
                    asyncTasks.push(function(callback){
                        // Call an async function, often a save() to DB
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


                                var options = itemHtml('.options').children('div').each(function() {
                                    var option = {};
                                    option.option_values = [];


                                    var optionText = itemHtml(this).children('b').text().split('::')[0];
                                    option.display_name = optionText;
                                    itemHtml(this).children('select').children('option').each(function() {
                                        var optionValue = itemHtml(this).text().trim();
                                        if (!optionValue.includes('Please Select')) {
                                            option.option_values.push(optionValue);
                                        }
                                    });
                                    console.log(option);
                                });

                                var product = {};
                                product.name = title;
                                product.sku = sku;

                                products.push(product);
                            }
                            callback();
                        });
                    });
                }
            });
        }
        async.parallel(asyncTasks, function(){
            // All tasks are done now
            res.status(200).json(products);
        });
    });
});

app.listen('8081')

console.log('Magic happens on port 8081');

exports = module.exports = app;

var express = require('express');
var fs = require('fs');
var request = require('request');
var cheerio = require('cheerio');
var app     = express();
var async = require('async');
var BigCommerce = require('node-bigcommerce');
var secret = require('./secret.json');

var bigCommerce = new BigCommerce(secret);

app.get('/products', function(req, res) {
    bigCommerce.get('/products', function(err, data, response){
        // Catch any errors, or handle the data returned
        // The response object is passed back for convenience
        console.log(data);
        console.log(response);
        console.log(err);
        return res.status(200).json(data);
    });
});

app.get('/categories', function(req, res) {
    bigCommerce.get('/categories', function(err, data, response){
        return res.status(200).json(data);
    });
});

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

                                var cost = itemHtml('span[itemprop="price"]').text().substr(1);

                                var detail = itemHtml('#tab-description').text();

                                var description = itemHtml(".description").text();
                                var productCode = description.split('\n')[0].split(': ')[1];
                                var weight = description.split('\n')[2].split(': ')[1];
                                var availability = description.split('\n')[3].split(': ')[1];

                                var option = {};

                                var options = itemHtml('.options').children('div').each(function() {
                                    option.option_values = [];


                                    var optionText = itemHtml(this).children('b').text().split('::')[0];
                                    option.display_name = optionText;
                                    itemHtml(this).children('select').children('option').each(function() {
                                        var optionValue = itemHtml(this).text().trim();
                                        if (!optionValue.includes('Please Select')) {
                                            option.option_values.push(optionValue);
                                        }
                                    });
                                });

                                var product = {};
                                product.name = title;
                                product.type = 'physical';
                                product.sku = sku;
                                // product.option = option;
                                product.cost_price = cost * 1;
                                product.availability = 'available';
                                product.description = detail;
                                product.price = cost * 1.5;
                                product.categories = [14];
                                product.weight = Math.round((weight.split(' ')[0])* 0.00220 * 100) / 100;
                                products.push(product);
                            }
                            callback();
                        });
                    });
                }
            });
        }
        async.parallel(asyncTasks, function(){
            // Make calls to BigCommerce API createProduct
            // Call createOption
            // Call createProductImage

            // All tasks are done now

            for (var i = 0; i < products.length; i++) {
                var product = products[i];
                bigCommerce.post('/products', product, function(err, data, response){
                    // Catch any errors, or handle the data returned
                    // The response object is passed back for convenience
                    console.log(err);
                });
            }
            res.status(200).json(products);
        });
    });
});

app.listen('8081')

console.log('Magic happens on port 8081');

exports = module.exports = app;
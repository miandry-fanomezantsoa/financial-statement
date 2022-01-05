# Financial Statement CLI application

## What is it ?
This application is used to perform checking on the **Paradox**'s monthly financial data like payments and refunds on some platform (Stripe, Checkout).

## Prerequisites
As a node application, you have to install :
- Node.js and npm package manager

## Installation
To install the application, so you can run it form anywhere in the directory of your computer,
1. First go to the root directory of the application : `cd root_dir`
2. Run this code to install this application globally : `npm i -g .`
3. Install application dependencies : `npm install` or `npm i`

### Configuration
You must add some environmental variables to a `.env` file to configure the application.

Here are the allowed keys:
- PORT : the port number in which the application will run. Eg : `3000`
- GOOGLE_API_KEY_PATH : The path to the file containing the `Google API token` relative to the root directory of the application. Eg : `/src/public/google-api-key.json`
- STRIPE_API_KEY : The key to use to perform API requests in Stripe

## Usage
#### Checking
To perform a check in a google sheet file, you have to run this command :

`financial-statement check -s <spreadSheetID>`

#### Exporting data
If the check is not OK, the application will print the founded problems in the console.
Otherwise, you can export Stripe payments data after the check is conclusive by running this command :

`financial-statement check -s <spreadSheetID> -p <file>`

Also you can also export Stripe refunds data after the check is conclusive by running this command :

`financial-statement check -s <spreadSheetID> -r <file>`

You can combine these two commands in a single command like this :

`financial-statement check -s <spreadSheetID> -p <payments_file> -r <refunds_file>`

#### Note : 
*Only two data format are supported when exporting data :*
- *CSV file (.csv)*
- *JSON file (.json)*

#### Perform adjustment
To make adjustment of calculation in Zoho Book if there is difference in transaction compared to Stripe transactions, checking these deviations for each payments and refunds is first done, then if sum of difference is not zero, adjustment on ZohoBook is performed by sending ZohoBook API call.

To perform deviations check, you can add the `d` parameter to the command above like so :

`financial-statement check -s <spreadSheetID> -d`

To make the adjustment, you can add the `a` parameter to the command above like so :

`financial-statement check -s <spreadSheetID> -d`

When adding the `a` parameter, you can omit the `d` parameter because **anyway, checking deviations is always done before making adjustment**.

For more options on the check command, you can get info by running the help command : `financial-statement --help`

## Uninstallation
To uninstall the application, just run this command :
`npm uninstall -g financial_statement`

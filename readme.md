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

## Usage
To perform a check in a google sheet file, you have to run this command :
`financial-statement check -s <spreadSheetID>`

If the check is not OK, the application will print the founded problems in the console.
Otherwise, you can export Stripe payments data after the check is conclusive by running this command :
`financial-statement check -s <spreadSheetID> -p <file>`
Also you can also export Stripe refunds data after the check is conclusive by running this command :
`financial-statement check -s <spreadSheetID> -r <file>`
You can combine these two commands in a single command like this :
`financial-statement check -s <spreadSheetID> -p <payments_file> -r <refunds_file>`

#### Note : 
***Only two data format are supported when exporting data :***
- ***CSV file (.csv)***
- ***JSON file (.json)***

For more options on the check command, you can get info by running the help command : `financial-statement --help`

## Uninstallation
To uninstall the application, just run this command :
`npm uninstall -g financial_statement`

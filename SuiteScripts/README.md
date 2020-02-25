# SuiteScripts
> Placeholder

## Setup

1. Create File
2. Save Files to File Cabinet<br/>
  `Documents > Files > New`
3. Create SuiteScript Record<br/>
  `Customization > Scripting > Scripts > New`<br/>
  <i>Save & Deploy to skip next step</i>
4. Deploy<br/>
  `Customization > Scripting > Script Deployments`

## Scripts

### Client Scripts

#### Sales Order
><i>sales_order_client.js</i>
Calculates handling cost based on region, adds it to the shipping cost and 
displays the total shipping cost. Adds a button to the sales order that calculates 
sales order total weight in lbs and total item count.

Regions
  - Region 1
    - Arizona, California, Idaho, Nevada, Utah
  - Region 2
    - Arkansas, Colorado, Kansas, Maryland, Montana, Nebraska, New Mexico, Oklahoma, Oregon, Texas,  Washington, Wyoming
  - Region 3
    - Alabama, Delaware, Florida, Georgia, Illinois, Indiana, Kentucky, Lousiana, Maryland, Massachusetts, Michigan, Minnesota, Mississippi, North Carolina, North Dakota, Ohio, South Carolina, South Dakota, Tennessee, Virginia, West Virginia, Wisconsin
  - Region 4
    - Connecticut, Washington D.C., Maine, New Hampshire, New Jersey, New York, Rhode Island, Vermont, Guam, U.S Virgin Islands
  - Region 5
    - Alaska, Hawaii, Puerto Rico, American Samoa
# ScheduledScripts
> Scheduled Scripts
- 10000 unit governance

## GET LOCATION AVAILABLE
> get_location_available.js

Creates a list of all items available at location 2, but not at location 1 and sends an email notification.

### Setup
#### Script Deployment

Script requires 2 paramaters.

<table>
  <tr>
    <th>ID</th>
    <th>Type</th>
    <th>Description</th>
  </tr>
  <tr>
    <td>_location_1</td>
    <td>Free-Form-Text</td>
    <td>The first location (Main Location). This location is checked for items with available quantity of 0.</td>
  </tr>
  <tr>
    <td>_location_2</td>
    <td>Free-Form-Text</td>
    <td>The second location. This location is checked for items with available quantity > 0.</td>
  </tr>
</table>

## GET LOCATION AVAILABLE TO TRANSFER
> get_location_available_for_transfer.js

Creates a list of all items available at location 2, but not at location 1 and sends an email notification. This is an updated version of 
<i>get_location_available.js</i>, but instead of creating the searches in the script it uses saved searches. Therefore this script can be reused by different script deployments. There was also issues in passing SQL Formulas via script paramaters.

### Setup
#### Script Deployment

Script requires 6 paramaters.

<table>
  <tr>
    <th>ID</th>
    <th>Type</th>
    <th>Description</th>
  </tr>
  <tr>
    <td>custscript_loc_avail_trans_search_1</td>
    <td>Free-Form-Text</td>
    <td>The saved search to use for location 1.</td>
  </tr>
  <tr>
    <td>custscript_loc_avail_trans_search_2</td>
    <td>Free-Form-Text</td>
    <td>The saved search to use for location 2.</td>
  </tr>
  <tr>
    <td>custscript_loc_avail_trans_loc_1</td>
    <td>Free-Form-Text</td>
    <td>The name of location1, used for the email.</td>
  </tr>
  <tr>
    <td>custscript_loc_avail_trans_loc_2</td>
    <td>Free-Form-Text</td>
    <td>The name of location2, used for the email.</td>
  </tr>
  <tr>
    <td>custscript_loc_avail_trans_email_id</td>
    <td>Free-Form-Text</td>
    <td>The internal ID of the employee to receive the email.</td>
  </tr>
  <tr>
    <td>custscript_loc_avail_trans_email_list	</td>
    <td>Free-Form-Text</td>
    <td>A comma seperated list of employee internal IDs with no spaces.</td>
  </tr>
</table>

## GET OUT OF STOCK
> get_out_of_stock.js

Creates a list of all items with 0 availability at the specified location and emails report to employees. It will only report on new out of stock items since the last time the script executed.

### Setup
#### Script Deployment

Script requires 3 paramaters.

<table>
  <tr>
    <th>ID</th>
    <th>Type</th>
    <th>Description</th>
  </tr>
  <tr>
    <td>custscript_out_of_stock_email_id</td>
    <td>Free-Form-Text</td>
    <td>The internal ID of the employee to receive the email.</td>
  </tr>
  <tr>
    <td>custscript_out_of_stock_email_list	</td>
    <td>Free-Form-Text</td>
    <td>A comma seperated list of employee internal IDs with no spaces.</td>
  </tr>
  <tr>
    <td>custscript_out_of_stock_dir	</td>
    <td>Free-Form-Text</td>
    <td>The id of the directory used to load and save files.</td>
  </tr>
</table>
/**
 * testBox.js
 * @NApiVersion 2.1
 * @NModuleScope Public
 */

define(['N/log'],
  function (log) {

    function selectBox(itemFulfill, boxIdx) {
      log.debug({
        title: 'SELECTING BOX',
        details: 'Running select box'
      });

      // var boxes = {
      //   membership: {
      //     x: 8.25,
      //     y: 6,
      //     z: 2.5,
      //     cols: [{ x: 0, y: 0, z: 0 }],
      //     remaining_col_space: 8.25
      //   },
      //   membership_large: {
      //     x: 11.25,
      //     y: 6,
      //     z: 2.5,
      //     cols: [{ x: 0, y: 0, z: 0 }],
      //     remaining_col_space: 11.25
      //   }
      // };
      // converted to array so we can iterate over it
      var boxes = [
        {
          name: 'Membership',
          x: 8.25,
          y: 6,
          z: 2.5,
          cols: [{ x: 0, y: 0, z: 0 }],
          remaining_col_space: 8.25
        },
        {
          name: 'Membership Large',
          x: 11.25,
          y: 6,
          z: 2.5,
          cols: [{ x: 0, y: 0, z: 0 }],
          remaining_col_space: 11.25
        },
        {
          name: 'Square',
          x: 7,
          y: 7,
          z: 6,
          cols: [{ x: 0, y: 0, z: 0 }],
          remaining_col_space: 7
        },
        {
          name: 'MD Flat Rate',
          x: 11,
          y: 8.5,
          z: 5.5,
          cols: [{ x: 0, y: 0, z: 0 }],
          remaining_col_space: 11
        }
      ];

      // Get items
      var lines = itemFulfill.getLineCount({ sublistId: 'item' });
      var items = [];
      for (var i = 0; i < lines; i++) {
        var quantity = itemFulfill.getSublistValue({ sublistId: 'item', fieldId: 'quantity', line: i });
        var width = itemFulfill.getSublistValue({ sublistId: 'item', fieldId: 'custcol_sp_item_width', line: i });
        var depth = itemFulfill.getSublistValue({ sublistId: 'item', fieldId: 'custcol_sp_item_length', line: i });
        var height = itemFulfill.getSublistValue({ sublistId: 'item', fieldId: 'custcol_sp_item_height', line: i });
        // Add dimensions to item list (making sure to take account quantity)
        for (var q = 0; q < quantity; q++) {
          items.push([width, depth, height]);
        }
      }
      // Sort the items list
      var sorted_items = sort_array(items);
      log.debug({
        title: 'SORTED ITEMS',
        details: JSON.stringify(sorted_items)
      });
      // var box = set_box_orientation(sorted_items[0], JSON.parse(JSON.stringify(boxes.membership)));
      var box = set_box_orientation(sorted_items[0], JSON.parse(JSON.stringify(boxes[boxIdx])));
      sorted_items.sort(function(a, b) { a[2] - b[2] });
      sorted_items = sorted_items.reverse();
      for (var i = 0; i < sorted_items.length; i++) {
        if (box) {
          box = add_to_box(sorted_items[i], box);
        } else {
          break;
        }
      }
      return box;
    }

    function add_to_box(product, box) {
      // Turn product if it is greater than y
      // This should only happen if the item height is < 0.25
      if (product[0] > box.y) {
        var shifted = product.shift();
        product[2] = product[1];
        product[1] = shifted;
      }
      master_loop:
      for (var i = 0; i < box.cols.length; i++) {
        var col = box.cols[i];
        // Column isn't empty, there is enough y space and x space
        //////////////////////////////////////////////////////////
        ///////////////////////////////////////////////////////////
        //////////////////////////////////////////////////////////
        if (col.x && box.y - col.y >= product[0] && col.x <= product[1]) {
          col.y += product[0];
          if (col.z < product[2]) col.z = product[2];
          break master_loop;
          // If the column is empty (new box)
          ////////////////////////////////////////////////////////////
          /////////////////////////////////////////////////////////////
          ///////////////////////////////////////////////////////////////
        } else if (!col.x && product[1] <= box.remaining_col_space) {
          log.debug({
            title: 'ADDING ITEM TO NEW BOX',
            details: JSON.stringify(product[1])
          });
          col.y = product[0];
          col.x = product[1];
          col.z = product[2];
          box.remaining_col_space -= product[1];
          break master_loop;
          // If on the last column and there is enough space for a new column
          ////////////////////////////////////////////////////////////////////
          ////////////////////////////////////////////////////////////////////
          ////////////////////////////////////////////////////////////////////
        } else if (i + 1 === box.cols.length && box.remaining_col_space >= product[1]) {
          box.cols.push({ x: product[1], y: product[0], z: product[2] });
          box.remaining_col_space -= product[1];
          break master_loop;
          // If on the last column and there isn't enough space for a new column
          /////////////////////////////////////////////////////////////////////////
          ///////////////////////////////////////////////////////////////////////////
          ///////////////////////////////////////////////////////////////////////////
        } else if (i + 1 === box.cols.length && box.remaining_col_space < product[1]) {
          // Look for vertical space
          starting_column:
          for (var s = 0; s < box.cols.length; s++) {
            var combined_x = 0;
            // If there is enough z to stack in col s
            /////////////////////////////////////////////////////
            /////////////////////////////////////////////////////
            if (box.z - box.cols[s].z >= product[2]) {
              //if there is enough x to stack in col s
              if (box.cols[s].x >= product[1]) {
                box.cols[s].z += product[2]
                break master_loop;
                // Try combining column space
                // If not on last column
                /////////////////////////////////////////
                /////////////////////////////////////////
              } else if (s + 1 !== box.cols.length) {
                combined_x += box.cols[s].x;
                ending_column:
                for (var e = s + 1; e < box.cols.length; e++) {
                  // If remaining col height > that product height
                  //////////////////////////////////////////////
                  if (box.z - box.cols[e].z >= product[2]) {
                    combined_x += box.cols[e].x;
                    if (combined_x >= product[1]) {
                      for (var f = s; f <= e; f++) {
                        box.cols[f].z += product[2];
                      }
                      break master_loop;
                      // If ending column is on last loop
                      //////////////////////////////////
                      //////////////////////////////////
                    } else if (e + 1 === box.cols.length) {
                      // If there is unallocated space in the box
                      //////////////////////////////////////////
                      if (combined_x + box.remaining_col_space >= product[1]) {
                        for (var a = 0; a < box.cols.length; a++) {
                          box.cols[a].z += product[2];
                        }
                        var new_col_x = product[1] - combined_x;
                        box.cols.push({ x: new_col_x, y: product[0], z: product[2] });
                        box.remaining_col_space -= new_col_x;
                        break master_loop;
                      } else {
                        break ending_column;
                      }
                    } else {
                      log.debug({
                        title: 'CONTINUE TO ending_column ' + e + 1,
                        details: 'Jump past ' + e
                      });
                    }
                    // Jump past e
                  } else {
                    s = e + 1;
                    break ending_column;
                  }
                }
              } else {
                // If only one column exists, and there is space left
                if (box.cols.length == 1 && box.cols[s].x + box.remaining_col_space >= product[1]) {
                  var new_col_x = product[1] - box.cols[s].x;
                  box.cols.push({ x: new_col_x, y: product[0], z: product[2] });
                  box.cols[s].z += product[2];
                  box.remaining_col_space -= new_col_x;
                  break master_loop;
                } else {
                  box = false;
                  break master_loop;
                }
              }
            } else if (s + 1 == box.cols.length) {
              box = false;
              break master_loop;
            }
          }
        }
      }
      return box;
    }

    function set_box_orientation(largest_product, box) {
      var oriented_box = JSON.parse(JSON.stringify(box));
      if (largest_product[0] > oriented_box.y) {
        // Turn the box
        var x = oriented_box.y;
        var y = oriented_box.x;
        oriented_box.x = x;
        oriented_box.y = y;
        oriented_box.remaining_col_space = x;
      }
      return oriented_box;
    }

    function sort_array(arr) {
      var sorted_arr = arr;
      for (var i = 0; i < sorted_arr.length; i++) {
        sorted_arr[i].sort(function(a, b) { a - b });
        sorted_arr[i] = sorted_arr[i].reverse();
      }
      sorted_arr.sort(function(a, b) { a[0] - b[0] });
      sorted_arr = sorted_arr.reverse();

      if (sorted_arr.length > 1) {
        var tall_items = [];
        var short_items = [];
        for (var i = 0; i < sorted_arr.length; i++) {
          if (sorted_arr[i][2] <= 0.25) {
            // const spliced = sorted_arr.splice(i,1)
            // sorted_arr = sorted_arr.concat(spliced)
            // i = i - 1
            short_items.push(sorted_arr[i]);
          } else {
            tall_items.push(sorted_arr[i]);
          }
        }
        sorted_arr = tall_items.concat(short_items);
      }
      return sorted_arr;
    }

    return {
      selectBox: selectBox
    }
  });
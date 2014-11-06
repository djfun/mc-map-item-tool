Feature: Create Minecraft map items client side
  Uploading an image and using the different steps
  Should create the correct canvas and send the correct data to the server
  Which is the main purpose of this web tool.

  Scenario: Creating a single map with the old colors

    Given I am on the client side version of the index page
    And the old colors are used
    When I upload "2013-10-18_00.28.30.png"
    Then I am able to split the image into 6 horizontal and 3 vertical parts

    When I select "1" horizontal and "1" vertical part
    Then the canvas should have the hash code "-1359257648" in step 3

    When I click on "reducecolors"
    Then the canvas should have the hash code "-1405170529" in step 4

    When I submit to create the map file on the server
    Then the map_item sent to the server should have the hash code "1654242093"
    And the x_center sent to the server should be '0'
    And the z_center sent to the server should be '0'
    And the dimension sent to the server should be '0'

  Scenario: Creating a single map with the new colors

    Given I am on the client side version of the index page
    And the new colors are used
    When I upload "2013-10-18_00.28.30.png"
    And I select "1" horizontal and "1" vertical part
    Then the canvas should have the hash code "-1359257648" in step 3

    When I click on "reducecolors"
    Then the canvas should have the hash code "1037695308" in step 4

    When I submit to create the map file on the server
    Then the map_item sent to the server should have the hash code "1892122178"
    And the x_center sent to the server should be '0'
    And the z_center sent to the server should be '0'
    And the dimension sent to the server should be '0'
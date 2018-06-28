<?php
$time = time();
header('Content-Type: application/json');
header('Content-Disposition: attachment; filename="data_export-' . $time . '.geojson"');

$dsn = 'sqlite://../../db/data.sqlite';
require '../../config/config.php';


// Print the head of the document

$arr = array('type' => 'FeatureCollection', 'crs' => '', 'features' => array());
$arr['crs']['type'] = 'name';
$arr['crs']['properties']['name'] = 'urn:ogc:def:crs:OGC:1.3:CRS84';


ArrestDB::Serve('GET', '/(#any)/', function ($table)
{
	$query = array
	(
		sprintf('SELECT *, (SELECT COUNT(*) FROM "likes" WHERE "sid" = suggestions.id and "type" = "dislike" ) AS "dislike", (SELECT COUNT(*) FROM "likes" WHERE "sid" = suggestions.id and "type" = "like" ) AS "like" FROM "suggestions"'),
	);
	
	$query = sprintf('%s;', implode(' ', $query));
	$data = ArrestDB::Query($query);
	$timezone = new DateTimeZone('America/Los_Angeles');


	foreach ($data as $id => $value)
	{
		$coordinates = json_decode($value['geometry']);
		$feature = array('type' => 'Feature', 'properties'  => array(), 'geometry'  => array());
		$feature['properties']['OBJECTID'] = $value['id'];
		$feature['properties']['Category'] = $value['category'];
		$feature['properties']['Comment'] = htmlspecialchars($value['comment'], ENT_QUOTES);
		$epoch = $value['created'];
		$dt = new DateTime("@$epoch");
		$dt->setTimezone($timezone);
		$feature['properties']['Username'] = htmlspecialchars($value['name'], ENT_QUOTES);
		$feature['properties']['Created'] = $dt->format('Y-m-d H:i:s');
		$feature['properties']['Likes'] = $value['like'];
		$feature['properties']['Dislikes'] = $value['dislike'];

		//Print Geometry
		if ($value['type'] == 'Point')
		{
			$feature['geometry']['type'] = 'point';
			$feature['geometry']['coordinates'] = array($coordinates[0], $coordinates[1], 0);

		}
		else if ($value['type'] == 'LineString')
		{
			$feature['geometry']['type'] = 'MultiLineString';
			$feature['geometry']['coordinates'] = array(array());
			
			foreach ($coordinates as $id => $coordinate)
			{
				array_push($feature['geometry']['coordinates'][0], array($coordinate[0], $coordinate[1], 0));
			}

		}

		array_push($GLOBALS['arr']['features'], $feature);

	}

	echo json_encode($GLOBALS['arr']);

});





?>
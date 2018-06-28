<?php

$time = time();
header('Content-Type: application/vnd.google-earth.kml+xml kml');
header('Content-Disposition: attachment; filename="data_export-' . $time . '.kml"');

$dsn = 'sqlite://../../db/data.sqlite';
require '../../config/config.php';


// Print the head of the document
echo '<?xml version="1.0" encoding="UTF-8"?>';
echo '<kml xmlns="http://www.opengis.net/kml/2.2">';
echo '<Document>';


ArrestDB::Serve('GET', '/(#any)/', function ($table)
{

	$query = array
	(
		sprintf('SELECT *, (SELECT COUNT(*) FROM "likes" WHERE "object" = suggestions.id) AS "likes" FROM "suggestions"'),
	);
	
	$query = sprintf('%s;', implode(' ', $query));
	$data = ArrestDB::Query($query);
	$timezone = new DateTimeZone('America/Los_Angeles');
	foreach ($data as $id => $value)
	{
		$coordinates = json_decode($value['geometry']);

		echo '<Placemark>';
		echo '<name>' . $value['id'] . '</name>';

		echo '<ExtendedData>';
		echo '<Data name="category">';
		echo '<value>'.$value['category'].'</value>';
		echo '</Data>';
		echo '<Data name="added_date">';
		$epoch = $value['created'];
		$dt = new DateTime("@$epoch");
		$dt->setTimezone($timezone);
		echo '<value>'.$dt->format('Y-m-d H:i:s').'</value>';
		echo '</Data>';
		echo '<Data name="username">';
		echo '<value>'.htmlspecialchars($value['name'], ENT_QUOTES).'</value>';
		echo '</Data>';
		echo '<Data name="likes">';
		echo '<value>'.$value['like'].'</value>';
		echo '</Data>';
		echo '<Data name="dislikes">';
		echo '<value>'.$value['dislike'].'</value>';
		echo '</Data>';
		echo '</ExtendedData>';

		echo '<description>' . htmlspecialchars($value['comment'], ENT_QUOTES) . '</description>';

		if ($value['type'] == 'Point')
		{
			echo '<Point>';
			echo '<coordinates>'.$coordinates[0].','.$coordinates[1].'</coordinates>';
			echo '</Point>';
		}
		else if ($value['type'] == 'LineString')
		{
			echo '<LineString>';
			echo '<coordinates>';
			
			foreach ($coordinates as $id => $coordinate)
			{
				echo $coordinate[0] . ',' . $coordinate[1] . ' ';
			}
			echo '</coordinates>';
			echo '</LineString>';
		}

		echo '</Placemark>';

	}

	// And finish the document

	echo '</Document>';
	echo '</kml>';

});





?>
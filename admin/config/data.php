<?php

$dsn = 'sqlite://../../db/data.sqlite';
require '../../config/config.php';


ArrestDB::Serve('GET', '/(#any)/', function ($table)
{

	//Grab users
	$query = array
	(
		sprintf('SELECT * FROM "%s" ORDER BY "id" DESC', $table),
	);

	if ($table == 'suggestions')
	{
		//Grab users
		$query = array
		(
			sprintf('SELECT *, (SELECT COUNT(*) FROM "likes" WHERE "sid" = suggestions.id and "type" = "dislike" ) AS "dislike", (SELECT COUNT(*) FROM "likes" WHERE "sid" = suggestions.id and "type" = "like" ) AS "like" FROM "suggestions"'),
		);
	}


	
	$query = sprintf('%s;', implode(' ', $query));
	$data = ArrestDB::Query($query);
	$result['data'] = $data;

	return ArrestDB::Reply($result);
});

ArrestDB::Serve('PUT', '/(#any)/(#num)', function ($table, $id)
{


	if (empty($GLOBALS['_PUT']) === true)
	{
		$result = ArrestDB::$HTTP[204];
	}
	else if (is_array($GLOBALS['_PUT']) === true)
	{

		foreach ($GLOBALS['_PUT'] as $key => $value)
		{
			$data[$key] = sprintf('"%s" = ?', $key);
		}

		$query = array
		(
			sprintf('UPDATE "%s" SET %s WHERE "%s" IN (%s)', $table, implode(', ', $data), 'id', $id),
		);

		$query = sprintf('%s;', implode(' ', $query));

		$result = ArrestDB::Query($query, $GLOBALS['_PUT']);

		if ($result === false)
		{
			$result = ArrestDB::$HTTP[409];
		}

		else
		{
			$result = ArrestDB::$HTTP[200];
		}
	}

	return ArrestDB::Reply($result);
});

ArrestDB::Serve('DELETE', '/(#any)/(#num)', function ($table, $id)
{
	$query = array
	(
		sprintf('DELETE FROM "%s" WHERE "%s" IN (%s)', $table, 'id', $id),
	);
	$query = sprintf('%s;', implode(' ', $query));
	$result = ArrestDB::Query($query);
	if ($result === false)
	{
		$result = ArrestDB::$HTTP[404];
	}
	else if (empty($result) === true)
	{
		$result = ArrestDB::$HTTP[204];
	}
	else
	{
		$result = ArrestDB::$HTTP[200];
	}
	return ArrestDB::Reply($result);
});


exit(ArrestDB::Reply(ArrestDB::$HTTP[400]));

?>
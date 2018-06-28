<?php
require 'config.php';
$FieldsGET = 'id, name, comment, type, geometry, category';


ArrestDB::Serve('GET', '/(#any)/', function ($table)
{

	if ($table == 'comments'){
		$GLOBALS['FieldsGET'] = 'id, name, comment, created';
	}

	$query = array
	(
		sprintf('SELECT %s FROM "%s"',$GLOBALS['FieldsGET'], $table),
	);

	if ($table == 'suggestions')
	{
		//Grab users
		$query = array
		(
			sprintf('SELECT %s, (SELECT COUNT(*) FROM "likes" WHERE "sid" = suggestions.id and "type" = "dislike" ) AS "dislike", (SELECT COUNT(*) FROM "likes" WHERE "sid" = suggestions.id and "type" = "like" ) AS "like" FROM "suggestions"', $GLOBALS['FieldsGET']),
		);
	}


	if (isset($_GET['sid']) === true)
	{
		$query[] = sprintf('WHERE sid = ' . "'%s'" . '', $_GET['sid']);
		$query[] = sprintf('ORDER BY "%s" %s', 'created', 'DESC');
	}

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

	return ArrestDB::Reply($result);
});


ArrestDB::Serve('POST', '/(#any)', function ($table)
{

	//Upload Settings
	$uploadOk = 1;
	$target_dir = "../img/uploads/";


	if (empty($_POST) === true)
	{
		$result = ArrestDB::$HTTP[204];
	}

	else if (is_array($_POST) === true)
	{
		$queries = [];

		if (count($_POST) == count($_POST, COUNT_RECURSIVE))
		{
			$_POST = [$_POST];
		}

		foreach ($_POST as $row)
		{
			$data = [];

			foreach ($row as $key => $value)
			{
				$data[sprintf('"%s"', $key)] = $value;
			}

			$data['"created"'] = $GLOBALS['time'];
			$data['"uip"'] = $_SERVER['REMOTE_ADDR'];
			$data['"uipp"'] = $_SERVER['HTTP_X_FORWARDED_FOR'];

			//Start Photo Upload
			foreach($_FILES as $file)
			{	

			    $target_file = $target_dir . basename($file['name']);
			    $imageFileType = pathinfo($target_file,PATHINFO_EXTENSION);
			    $imageFileType = strtolower($imageFileType);
			    $fileName = md5(basename($file['name']) . $GLOBALS['time'] . rand()) . '.' . $imageFileType;

			    // Check if image file is a actual image or fake image
			    $check = getimagesize($file["tmp_name"]);
			    if($check == false) {
			        // echo "File is not an image.";
			        $uploadOk = 0;
			    }

			    // Check if file already exists
			    if (file_exists($target_file)) {
			        // echo "Sorry, file already exists.";
			        $uploadOk = 0;
			    }

			    // Check file size
			    if ($file["size"] > (1000000*5)) {
			        // echo "Sorry, your file is too large.";
			        $uploadOk = 0;
			    }

			    // Allow certain file formats
			    if($imageFileType != "jpg" && $imageFileType != "png" && $imageFileType != "jpeg"
			    && $imageFileType != "gif" ) {
			        // echo "Sorry, only JPG, JPEG, PNG & GIF files are allowed.";
			        $uploadOk = 0;
			    }


			    // Check if $uploadOk is set to 0 by an error FIX THIS AREA
			    if ($uploadOk == 0) {

			        $result = ArrestDB::$HTTP[imageFail];
			        return ArrestDB::Reply($result);

			    // if everything is ok, try to upload file
			    } else {
			        if(move_uploaded_file($file['tmp_name'], $target_dir . $fileName))
			        {
			        	$data['"photo"'] = $fileName;
			            // echo "The file " . $fileName . " has been uploaded.";
			        }
			        else
			        {
			            $result = ArrestDB::$HTTP[imageFail];
    			        return ArrestDB::Reply($result);
			        }
			    }
			    
			}


			$query = array
			(
				sprintf('INSERT INTO "%s" (%s) VALUES (%s)', $table, implode(', ', array_keys($data)), implode(', ', array_fill(0, count($data), '?'))),
			);

			$queries[] = array
			(
				sprintf('%s;', implode(' ', $query)),
				$data,
			);
		}

		if (count($queries) > 1)
		{
			ArrestDB::Query()->beginTransaction();

			while (is_null($query = array_shift($queries)) !== true)
			{
				if (($result = ArrestDB::Query($query[0], $query[1])) === false)
				{
					ArrestDB::Query()->rollBack(); break;
				}
			}

			if (($result !== false) && (ArrestDB::Query()->inTransaction() === true))
			{
				$result = ArrestDB::Query()->commit();
			}
		}

		else if (is_null($query = array_shift($queries)) !== true)
		{
			$result = ArrestDB::Query($query[0], $query[1]);
		}

		if ($result === false)
		{
			$result = ArrestDB::$HTTP[409];
		}

		else
		{
			$result = ArrestDB::$HTTP[201];
		}
	}

	return ArrestDB::Reply($result);
});


ArrestDB::Serve('PUT', '/(#any)/(#num)', function ($table, $id)
{	

	// Grab Current Likes
	$query = array
	(
		sprintf('SELECT %s FROM "%s"', 'likes', $table),
	);
	if (isset($id) === true)
	{
		$query[] = sprintf('WHERE "%s" = ? LIMIT 1', 'id');
	}
	$query = sprintf('%s;', implode(' ', $query));
	$result = (isset($id) === true) ? ArrestDB::Query($query, $id) : ArrestDB::Query($query);

	if (empty($GLOBALS['_PUT']) === true)
	{
		$result = ArrestDB::$HTTP[204];
	}
	else if (is_array($GLOBALS['_PUT']) === true)
	{

		if (is_numeric($result[0]['likes'])){
			$GLOBALS['_PUT']['likes'] = $result[0]['likes'] + 1;
		}
		else {
			unset($GLOBALS['_PUT']['likes']);
		}


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


exit(ArrestDB::Reply(ArrestDB::$HTTP[400]));
?>
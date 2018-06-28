<?php
require 'config.php';

//Start POST data
ArrestDB::Serve('POST', '/(#any)', function ($table)
{

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

			require 'mailer/smtp.php';

			//Set who the message is to be sent to
			$mail->addAddress('bikeplan@oaklandnet.com', 'Project Manager');
			//Set the subject line
			$mail->Subject = 'Public Input Map Comment - Oakland';

			$html = 'Hello,<br><br>Someone has used the contact form at '. $GLOBALS['baseURL'].$_SERVER[REQUEST_URI].'.<br><br><b>Email: </b>'.$data['"email"'].'<br><br><b>Message: </b>'.$data['"comment"'];
			$mail->msgHTML($html);

			//send the message, check for errors
			if (!$mail->send()) {
			    $result['success']['email'] = $mail->ErrorInfo;
			} else {
			    $result['success']['email'] = 'true';
			}

			return ArrestDB::Reply($result);

		}

	}

});

exit(ArrestDB::Reply(ArrestDB::$HTTP[400]));

?>
<?php

require dirname(__DIR__) . '/app/Core/Autoload.php';

use App\Core\Application;

$app = new Application(dirname(__DIR__));
$request = $app->bootstrap();
$app->run($request);

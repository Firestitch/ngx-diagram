<?

	$ios_sizes = [ 20, 29, 40, 50, 58, 60, 72, 76, 80, 87, 100, 114, 120, 144, 152, 176, 180 ];

	foreach($ios_sizes as $size)
		passthru("convert icon.png -resize ${size}x${size} ios/icon-${size}.png");


	$android_sizes = [ "ldpi"=>36, "mdpi"=>48, "hdpi"=>72, "xhdpi"=>96 ];

	foreach($android_sizes as $name=>$size)
		passthru("convert icon.png -resize ${size}x${size} android/icon-${name}.png");


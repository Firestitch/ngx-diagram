<?

	$android_sizes = [ "port-hdpi"=>[480,800], "port-ldpi"=>[200,320], "port-mdpi"=>[320,480], "port-xhdpi"=>[720,1280] ];

	foreach($android_sizes as $name=>$size)
		passthru("convert portrait.png -resize x${size[1]} -gravity center -crop ${size[0]}x${size[1]}+0+0 android/${name}.png");


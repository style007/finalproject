<?php

date_default_timezone_set('Europe/Athens');
header('Content-Type: text/html; charset=utf-8');
ini_set('error_reporting', E_ALL | E_STRICT);
error_reporting(E_ALL | E_STRICT);
ini_set('register_globals', 0);
ini_set('log_errors', 1);
ini_set('html_errors', 1);
ini_set('display_errors', 1);
ob_end_flush();

define("OPENCAST_URL", "http://opencastau.tau.ac.il/");
$dir_path = '/home/asaf.rokach/www/finalproject/php/';
$cookiePath = $dir_path . 'cookie.txt';
$fileTitle = "filefromphp" . uniqid() . ".wmv";
$filePath = $dir_path . 't1min.wmv';
$chunkSize = 2072576;

echo '<pre>';
$data = callUrl('POST', 'j_spring_security_check', array('j_username' => 'admin', 'j_password' => 'opencast', 'submit' => 'Login'));

$data = callUrl('GET', 'info/me.json', array());
//echo '<pre>' . print_r(json_decode($data), 1) . '</pre>';

$mediaPackage = callUrl('GET', 'ingest/createMediaPackage');
$dublinXML = createDublinCore($fileTitle);

echo "\n---\n";

$mediaPackage = callUrl('POST', 'ingest/addDCCatalog', array(
    'dublinCore' => $dublinXML,
    'flavor' => 'dublincore/episode',
    'mediaPackage' => $mediaPackage)
);
echo $mediaPackage;

$job_id = callUrl('POST', 'upload/newjob', array(
    'chunksize' => $chunkSize,
    'filename' => $fileTitle,
    'filesize' => filesize($filePath),
    'flavor' => 'presentation/source',
    'mediaPackage' => $mediaPackage)
);

sleep(5);

$chunkNumber = 0;
$fp = fopen($filePath, 'r');


while (!feof($fp)) {
    echo "\n------------------------------------------\n";
    echo "piece: " . $chunkNumber . "\n\n";
    $jsonJob = callUrl('GET', 'upload/job/' . $job_id . '.json');
    print_r(json_decode($jsonJob));
    echo "\n\n";
    $data = fread($fp, $chunkSize);
    $chunkPath = $dir_path . uniqid() . 'blob';
    file_put_contents($chunkPath, $data);

    $params = array(
        'chunknumber' => $chunkNumber,
        'jobID' => $job_id
    );
    $ret = callFileUpload(OPENCAST_URL . 'upload/job/' . $job_id, $data, $params);
    /* $ret = callUrl('POSTFILE', 'upload/job/' . $job_id, array(
      'chunknumber' => $chunkNumber,
      'jobID' => $job_id,
      'filedata' => curl_file_create($chunkPath, 'application/octet-stream', 'blob'))
      ); */
    echo "\n\n" . $ret . "\n\n";
    $jsonJob = callUrl('GET', 'upload/job/' . $job_id . '.json');
    print_r(json_decode($jsonJob));
    unlink($chunkPath);
    $data = null;
    $chunkNumber++;
    flush();
    sleep(4);
    echo "\n------------------------------------------\n";
}
fclose($fp);

//addTrack
echo "\n\n now sleeping...";
sleep(10);

$jsonJob = callUrl('GET', 'upload/job/' . $job_id . '.json');
echo "uploadJob: \n" . $jsonJob . "\n\n\n\n jsonDecode:\n";
print_r(json_decode($jsonJob));
echo "\n\n";

$xmlMP = simplexml_load_string($mediaPackage);
echo "\n trackUri: \n" . $jsonJob->uploadjob->payload->url . "\n";
$mediaPackage = callUrl('POST', 'mediapackage/addTrack', array(
    'flavor' => 'presentation/source',
    'mediapackage' => $mediaPackage,
    'trackUri' => $jsonJob->uploadjob->payload->url
        )
);

$ingest = callUrl('POST', 'ingest/ingest/full', array(
    'archiveOp' => 'true',
    'distribution' => 'Matterhorn Media Module',
    'mediaPackage' => $mediaPackage
        )
);
echo $job_id . '<Br/><br/>';
echo $ingest;
echo '</pre>';

function createDublinCore($fileTitle) {
    return '<dublincore xmlns="http://www.opencastproject.org/xsd/1.0/dublincore/" xmlns:dcterms="http://purl.org/dc/terms/"><dcterms:title xmlns="">recoridng-restapi-panel3</dcterms:title><dcterms:creator xmlns=""></dcterms:creator><dcterms:isPartOf xmlns=""></dcterms:isPartOf><dcterms:license xmlns="">Creative Commons 3.0: Attribution-NonCommercial-NoDerivs</dcterms:license><dcterms:license xmlns=""></dcterms:license><dcterms:recordDate xmlns="">2015-02-26</dcterms:recordDate><dcterms:contributor xmlns=""></dcterms:contributor><dcterms:subject xmlns=""></dcterms:subject><dcterms:language xmlns=""></dcterms:language><dcterms:description xmlns=""></dcterms:description><dcterms:rights xmlns=""></dcterms:rights><dcterms:created xmlns="">2015-02-26T14:42:00Z</dcterms:created></dublincore>';
    $str = '<dublincore xmlns="http://www.opencastproject.org/xsd/1.0/dublincore/" xmlns:dcterms="http://purl.org/dc/terms/">'
            . '<dcterms:title xmlns="">'
            . $fileTitle
            . '</dcterms:title><dcterms:creator xmlns=""></dcterms:creator>'
            . '<dcterms:isPartOf xmlns=""></dcterms:isPartOf>'
            . '<dcterms:license xmlns="">Creative Commons 3.0: Attribution-NonCommercial-NoDerivs</dcterms:license><dcterms:license xmlns=""></dcterms:license>'
            . '<dcterms:recordDate xmlns="">' . date('Y-m-d') . '</dcterms:recordDate><dcterms:contributor xmlns=""></dcterms:contributor>'
            . '<dcterms:subject xmlns=""></dcterms:subject><dcterms:language xmlns=""></dcterms:language><dcterms:description xmlns=""></dcterms:description>'
            . '<dcterms:rights xmlns=""></dcterms:rights><dcterms:created xmlns="">' . gmdate("Y-m-d\TH:i:s\Z") . '</dcterms:created></dublincore>';
    return $str;
}

function callFileUpload($url, $chunkPath, $params) {
    global $cookiePath;

    // form field separator
    $delimiter = '-------------' . uniqid();
// file upload fields: name => array(type=>'mime/type',content=>'raw data')
    $fileFields = array(
        'filedata' => array(
            'type' => 'application/octet-stream',
            'content' => $chunkPath
        ) /* ... */
    );
// all other fields (not file upload): name => value
    $postFields = $params;

    $data = '';

// populate normal fields first (simpler)
    foreach ($postFields as $name => $content) {
        $data .= "--" . $delimiter . "\r\n";
        $data .= 'Content-Disposition: form-data; name="' . $name . '"';
        // note: double endline
        $data .= "\r\n\r\n";
        $data .= $content . "\r\n";
    }
// populate file fields
    foreach ($fileFields as $name => $file) {
        $data .= "--" . $delimiter . "\r\n";
        // "filename" attribute is not essential; server-side scripts may use it
        $data .= 'Content-Disposition: form-data; name="' . $name . '";' .
                ' filename="' . $name . '"' . "\r\n";
        // this is, again, informative only; good practice to include though
        $data .= 'Content-Type: ' . $file['type'] . "\r\n";
        // this endline must be here to indicate end of headers
        $data .= "\r\n";
        // the file itself (note: there's no encoding of any kind)
        $data .= $file['content'] . "\r\n";
    }
// last delimiter
    $data .= "--" . $delimiter . "--\r\n";

    $handle = curl_init($url);
    curl_setopt($handle, CURLOPT_POST, true);
    curl_setopt($handle, CURLOPT_HTTPHEADER, array(
        'Content-Type: multipart/form-data; boundary=' . $delimiter,
        'Content-Length: ' . strlen($data)));
    curl_setopt($handle, CURLOPT_POSTFIELDS, $data);
    curl_setopt($handle, CURLOPT_COOKIEJAR, $cookiePath);
    curl_setopt($handle, CURLOPT_COOKIEFILE, $cookiePath);
    $data = curl_exec($handle);
    return $data;
}

function callUrl($method, $url, $params = array()) {
    echo "\n\n " . $url . "\n";
    global $cookiePath;
    $url = OPENCAST_URL . $url;
    $ch = curl_init();
    curl_setopt($ch, CURLINFO_HEADER_OUT, true);
    $params_str = http_build_query($params);
    if ($method == "POST") {
        curl_setopt($ch, CURLOPT_POST, 1);
        curl_setopt($ch, CURLOPT_POSTFIELDS, $params_str);
    } elseif ($method == "GET") {
        $url .= '?' . $params_str;
    } elseif ($method == "POSTFILE") {
        curl_setopt($ch, CURLOPT_POST, 1);
        curl_setopt($ch, CURLOPT_POSTFIELDS, $params);
        curl_setopt($ch, CURLOPT_HTTPHEADER, array(
            'Content-type: multipart/form-data')
        );
    }

    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, TRUE);
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_VERBOSE, 1);
    curl_setopt($ch, CURLOPT_HEADER, 1);


    curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);

    curl_setopt($ch, CURLOPT_COOKIEJAR, $cookiePath);
    curl_setopt($ch, CURLOPT_COOKIEFILE, $cookiePath);

    curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0 (Windows; U; Windows NT 5.1; en-US; rv:1.8.1.13) Gecko/20080311 Firefox/2.0.0.13');

    $responseData = curl_exec($ch);
    if (!curl_errno($ch)) {
        
    } else {
        return false;
    }
    curl_close($ch);
    list($headers, $content) = explode("\r\n\r\n", $responseData, 2);
    echo $headers;
    echo "\n\n\n\n";
    return $content;
}

function curl_file_create($filename, $mimetype = '', $postname = '') {
    return "@$filename;filename="
            . ($postname ? : basename($filename))
            . ($mimetype ? ";type=$mimetype" : '');
}

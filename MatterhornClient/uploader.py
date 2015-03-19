#!/usr/bin/python

__author__ = "Matan Lachmish and Asaf Rokach"
__copyright__ = "Copyright 2015, TAU Matterhorn project"
__version__ = "1.2"
__status__ = "Development"

import json
import xmltodict
import sys
import os
import datetime
import requests
import time
import pytz

#File containing details of matterhorn server
CONST_CONF_FILE = 'uploader.conf'

#Chunk size for splitting the video file
CONST_CHUNK_SIZE = 2072576

def main(argv):
    # Usage check
    if 3 != len(argv):
        print "Usage: python %s [movie file] [Joomla! id]" % argv[0]
        return -1

    print ''
    print '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~'
    print '~~~ Welcome to TAU Matterhorn lecture uploader ~~~'
    print '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~'
    print ''

    print 'Loading "uploader.conf" configuration',
    try:
        confData = json.loads(open(CONST_CONF_FILE).read())
        matterhornUser = confData["USER"]
        matterhornPassword = confData["PASSWORD"]
        matterhornURL = confData["MATTERHORNURL"]
    except IOError:
        print 'Cannot find "uploader.conf" file'
        return -1
    except KeyError:
        print '"uploader.conf" file have invalid structure'
        return -1
    printDone()


    print 'Preparing video file',
    try:
        movieFile = argv[1];
        movie = open(movieFile, 'rb')
    except IOError:
        print 'Cannot open ' + movieFile
        return -1
    printDone()

    #session object
    session = requests.session()

    #Check credentials
    print "Logging in Matterhorn server",
    login_data = dict(j_username=matterhornUser, j_password=matterhornPassword, submit="Login")
    session.post(matterhornURL + '/j_spring_security_check', data=login_data)
    response = session.get(matterhornURL + '/info/me.json')
    roles = json.loads(response.content)["roles"]
    if "ROLE_ADMIN" not in roles:
        print "You must have admin role in order to upload a file"
        return -1
    printDone()

    # lectureTitle = raw_input("Please enter lecture title: ")
    lectureTitle = argv[2]

    print "Creating a media package",
    response = session.get(matterhornURL + '/ingest/createMediaPackage')
    mediaPackage = response.content
    printDone()
    matterhornId = xmltodict.parse(mediaPackage)["mediapackage"]["@id"]
    print "A new media package was created with id: " + matterhornId

    moviePath = os.path.dirname(os.path.abspath(movieFile))
    mapFileName = moviePath + '/' + argv[2] + '.map'
    print "Creating the Joomla!-Matterhorn map file named " + mapFileName,
    mapFile = open(mapFileName, 'w+')
    mapFile.write(matterhornId)
    mapFile.close()
    printDone()

    print "Add DC Catalog",
    params = dict(flavor='dublincore/episode', mediaPackage=mediaPackage,
                  dublinCore=createDublinCore(lectureTitle, movie.name))
    response = session.post(matterhornURL + '/ingest/addDCCatalog', data=params)
    mediaPackage = response.content
    printDone()

    print "Creating a new job",
    movieSize = os.path.getsize(movieFile)
    params = dict(filename=movieFile, filesize=movieSize, chunksize=CONST_CHUNK_SIZE, flavor='presentation/source',
                  mediapackage=mediaPackage)
    response = session.post(matterhornURL + '/upload/newjob', data=params)
    jobID = response.content
    printDone()

    uploaded = 0
    chunkNumber = 0
    numberOfChunks = movieSize / CONST_CHUNK_SIZE
    print 'Uploading ' + str(movieSize) + ' Bytes in ' + str(numberOfChunks) + ' chunks, this may take a while...'
    while (uploaded < movieSize):
        printProgress(int(chunkNumber / float(numberOfChunks) * 100))

        payload = {'chunknumber': chunkNumber, 'jobID': jobID}
        chunk = movie.read(CONST_CHUNK_SIZE)
        files = {'filedata': ('blob', chunk), 'type': 'application/octet-stream'}
        response = session.post(matterhornURL + '/upload/job/' + jobID, files=files, data=payload)
        uploaded += CONST_CHUNK_SIZE
        chunkNumber += 1
    print ""

    print "Checking job status:"
    while True:
        response = session.get(matterhornURL + '/upload/job/' + jobID + ".json")
        jsonResponse = json.loads(response.content)
        state = jsonResponse["uploadjob"]["state"]
        print "Job state is: " + state
        if state == "COMPLETE":
            fileUri = jsonResponse["uploadjob"]["payload"]["url"]
            print "File uri is: " + fileUri
            break
        time.sleep(1) #Wait a sec before next status check

    print "Adding track",
    params = dict(mediapackage=mediaPackage, trackUri=fileUri, flavor='presentation/source')
    response = session.post(matterhornURL + '/mediapackage/addTrack', data=params)
    mediaPackage = response.content
    printDone()

    print "Ingest video",
    params = dict(archiveOp='true', distribution='Matterhorn Media Module', mediaPackage=mediaPackage)
    response = session.post(matterhornURL + '/ingest/ingest/full', data=params)
    workflow = response.content
    printDone()
    print "A new workflow has been created. Success"


def createDublinCore(lectureTitle, fileName):
    recordTime = os.path.getctime(fileName)
    recordDate = datetime.datetime.fromtimestamp(recordTime).strftime('%Y-%m-%d')

    ts = time.time()
    local = pytz.timezone ("Asia/Jerusalem")
    curTime=datetime.datetime.fromtimestamp(ts).strftime('%Y-%m-%dT%H:%M:%SZ')
    curTimeSimple = datetime.datetime.strptime (curTime, "%Y-%m-%dT%H:%M:%SZ")
    local_dt = local.localize(curTimeSimple, is_dst=None)
    utc_dt = local_dt.astimezone (pytz.utc)
    createTime = utc_dt.strftime ("%Y-%m-%dT%H:%M:%SZ")

    dublinCore = '<dublincore xmlns="http://www.opencastproject.org/xsd/1.0/dublincore/" xmlns:dcterms="http://purl.org/dc/terms/"><dcterms:title>' + lectureTitle + '</dcterms:title><dcterms:creator></dcterms:creator><dcterms:isPartOf></dcterms:isPartOf><dcterms:license>Creative Commons 3.0: Attribution-NonCommercial-NoDerivs</dcterms:license><dcterms:license></dcterms:license><dcterms:recordDate>' + recordDate + '</dcterms:recordDate><dcterms:contributor></dcterms:contributor><dcterms:subject></dcterms:subject><dcterms:language></dcterms:language><dcterms:description></dcterms:description><dcterms:rights></dcterms:rights><dcterms:created>' + createTime + '</dcterms:created></dublincore>'
    return dublinCore

def printDone():
    print '... Done'

def printProgress(percentage):
    sys.stdout.write("\r%d%%" % percentage)
    sys.stdout.flush()


if __name__ == "__main__":
    main(sys.argv)
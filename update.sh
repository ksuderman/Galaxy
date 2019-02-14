#!/usr/bin/env bash

if [ $# != '2' ] ; then
	echo "USAGE: $0 [galaxy] [new-galaxy]"
	exit 1
fi
galaxy=$1
dest=$2

if [ ! -d "$galaxy" ] ; then
	echo "$galaxy is not a directory."
	exit 2
fi

if [ ! -d "$dest" ] ; then
	echo "$dest is not a directory."
	exit 2
fi

cp $galaxy/config/galaxy.ini $dest/config
cp -r $galaxy/config/plugins/visualizations/brat $dest/config/plugins/visualizations
cp -r $galaxy/lib/lappsgrid $dest/lib
cp -r $galaxy/database/files $dest/database
cp -r $galaxy/database/ftp $dest/database


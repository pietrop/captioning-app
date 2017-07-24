#!/bin/bash

# usage 
# ./Segment_Transcript.sh path_to_text_file

# segment transcript into sentences
# perl sentence-boundary.pl -d HONORIFICS -i "$f" -o test.txt

# Add blank line after every new line
# sed -e 'G' test.txt > test2.txt

# Break each line at 35 characters
fold -w 35 -s  "$f" > test3.txt

 # Insert new line for every two lines, preserving paragraphs
perl -00 -ple 's/.*\n.*\n/$&\n/mg' test3.txt > "$f"
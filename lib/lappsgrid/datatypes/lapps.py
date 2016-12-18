from galaxy.datatypes.data import Text
from galaxy.datatypes.data import get_file_peek
from galaxy.datatypes.data import nice_size
from galaxy.datatypes.metadata import MetadataElement
from galaxy import util

import tempfile
import subprocess
import json
import gzip
import os
import re
import itertools

import logging

from galaxy.model.metadata import ListParameter, DictParameter, MetadataParameter

log = logging.getLogger(__name__)

class LappsJson( Text ):
    edam_format = "format_3464"
    #file_ext = "json"
    blurb = "JavaScript Object Notation (JSON)"

    def set_peek(self, dataset, is_multi_byte=False):
        if not dataset.dataset.purged:
            dataset.peek = get_file_peek(dataset.file_name, is_multi_byte=is_multi_byte)
            dataset.blurb = self.blurb
        else:
            dataset.peek = 'file does not exist'
            dataset.blurb = 'file purged from disc'

    def sniff(self, filename):
        """
            Try to load the string with the json module. If successful it's a json file.
        """
        log.info("JSON sniffing %s", filename)
        return self._looks_like_json(filename)

    def _looks_like_json(self, filename):
        # Pattern used by SequenceSplitLocations
        if os.path.getsize(filename) < 50000:
            # If the file is small enough - don't guess just check.
            try:
                json.load(open(filename, "r"))
                return True
            except Exception:
                return False
        else:
            with open(filename, "r") as fh:
                ch = self.read(fh)
                return ch == '{' or ch == '['


    def read(self, f):
        """
        Reads the next non-whitespace character from the file handle.

        :param f: an open file handle
        :return: the next non-whitespace character in the file.
        """
        c = f.read(1)
        while c.isspace():
            c = f.read(1)
        # end while
        return c

    # end read
    def display_peek(self, dataset):
        try:
            return dataset.peek
        except:
            return "JSON file (%s)" % ( nice_size(dataset.get_size()) )


class Lapps( LappsJson ):
    """
        Lapps Container.

        A Lapps container is a JSON map with exactly two entries:
        - discriminator
        - payload

        Both the discriminator and payload are string objects, with the value
        of the discriminator being used to determine how the payload should be
        interpreted.

        This means we can identify a LAPPS document by searching for something
        that looks like JSON and starts with a key named "discriminator".
    """
    header = '''{"discriminator":'''
    blurb = "Lapps Data object"

    # MetadataElement(name="annotations",
    #                 desc="Annotations added during processing",
    #                 default=[], param=ListParameter, readonly=False, visible=True, no_value=[])

    # def __init__(self, **kwd):
    #     Json.__init__(self, **kwd)

    # def init_meta( self, dataset, copy_from=None ):
    #     Json.init_meta(self, dataset, copy_from=copy_from)

    def _looks_like_lapps(self, prefix, filename):
        with open(filename, "r") as fh:
            for c in prefix:
                if c != self.read(fh):
                    return False

        return True

    def sniff(self, filename):
        """
        Reads the start of the file (ignoring whitespace) looking for the
        required LIF header.

        :param filename: The name of the file to be checked.
        :return: True if filename is a LIF file, False otherwise.
        """
        log.info("LAPPS sniffing %s", filename)
        return self._looks_like_lapps(self.header, filename)
        #with open(filename, "r") as fh:
        #    for c in self.header:
        #        if c != self.read(fh):
        #            return False

        #log.info("Sniffed a LAPPS file.")
        #return True


class LifText( Lapps ):
    file_ext = "liftxt"
    header = '''{"discriminator":"http://vocab.lappsgrid.org/ns/media/text"'''
    blurb = "Data object with plain text as the payload."
    def sniff(self, filename):
        return self._looks_like_lapps(self.header, filename)


class Lif( Lapps ):
    """
        The Lapps Interchange Format.

        LIF files are json files conforming to the schema at
        http://vocab.lappsgrid.org/schema/lif.json  If we ignore whitespace
        we know EXACTLY what the opening sequence of characters will be.

    """
    file_ext = "lif"
    header = '''{"discriminator":"http://vocab.lappsgrid.org/ns/media/jsonld'''
    blurb = "Lapps Interchange Format (LIF)"

    MetadataElement(name="views", desc="Number of views",
                    default=0, param=MetadataParameter, readonly=False, visible=True)
    MetadataElement(name="declared_annotations1", desc="Annotations declared in all views",
                    default=[], param=ListParameter, readonly=False, visible=True, no_value=[])
    MetadataElement(name="declared_annotations2", desc="Annotations declared in last view",
                    default=[], param=ListParameter, readonly=False, visible=True, no_value=[])
    MetadataElement(name="actual_annotations1", desc="Annotations found in all views",
                    default={}, param=DictParameter, readonly=False, visible=True, no_value={})
    MetadataElement(name="actual_annotations2", desc="Annotations found in last view",
                    default={}, param=DictParameter, readonly=False, visible=True, no_value={})


    def sniff(self, filename):
        """Reads the start of the file looking for the required LIF header.

        :param filename: The name of the file to be checked.
        :return: True if filename is a LIF file, False otherwise.

        """
        log.info("LIF: Sniffing %s", filename)
        with open(filename, "r") as fh:
            for c in self.header:
                if c != self.read(fh):
                    return False
        log.info("Found a LIF file.")
        return True


    def init_meta( self, dataset, copy_from=None ):
        # for some reason I have to add this here otherwise set_meta() is never executed
        self.set_meta(dataset)

    def set_meta(self, dataset, **kwd):
        """Fill in dataset.metadata with number of views and declared (in the metadata)
        and actual annotations in all the views and just the last view."""
        lif = LifObject(dataset)
        dataset.metadata.views = len(lif.views)
        declared_annotations1 = lif.declared_annotations()
        declared_annotations2 = lif.declared_annotations(last_only=True)
        actual_annotations1 = lif.actual_annotations()
        actual_annotations2 = lif.actual_annotations(last_only=True)
        for annotation in declared_annotations1:
            dataset.metadata.declared_annotations1.append(annotation)
        for annotation in declared_annotations2:
            dataset.metadata.declared_annotations2.append(annotation)
        for annotation, count in actual_annotations1.items():
            dataset.metadata.actual_annotations1[annotation] = count
        for annotation, count in actual_annotations2.items():
            dataset.metadata.actual_annotations2[annotation] = count
        if False:
            print 'dataset.metadata.views', dataset.metadata.views
            print 'dataset.metadata.declared_annotations1', dataset.metadata.declared_annotations1
            print 'dataset.metadata.declared_annotations2', dataset.metadata.declared_annotations2
            print 'dataset.metadata.actual_annotations1', dataset.metadata.actual_annotations1
            print 'dataset.metadata.actual_annotations2', dataset.metadata.actual_annotations2


class Gate( Lapps ):
    """
        GATE/XML in a JSON wrapper.
        See: http://gate.ac.uk
    """
    file_ext = "gate"
    header = '{"discriminator":"http://vocab.lappsgrid.org/ns/media/xml#gate"'
    blurb = "Gate/XML in a Lapps Container"

    # def __init__(self, **kwd):
    #     Lapps.__init__(self, **kwd)
    #
    # def init_meta( self, dataset, copy_from=None ):
    #     Lapps.init_meta(self, dataset, copy_from=copy_from)

    def sniff(self, filename):
        """
        Reads the start of the file (ignoring whitespace) looking for the
        required GATE header.

        :param filename: The name of the file to be checked.
        :return: True if filename is a GATE file, False otherwise.
        """
        log.info("GATE: Sniffing %s", filename)
        with open(filename, "r") as fh:
            for c in self.header:
                if c != self.read(fh):
                    return False

        log.info("Found a GATE file.")
        return True


class LDC( Lapps ):
    """
        LDC/XML in a JSON wrapper.

    """
    file_ext = "ldc"
    header = '{"discriminator":"http://vocab.lappsgrid.org/ns/media/xml#ldc"'
    blurb = "LDC/XML in a Lapps Container"

    # def __init__(self, **kwd):
    #     Lapps.__init__(self, **kwd)
    #
    # def init_meta( self, dataset, copy_from=None ):
    #     Lapps.init_meta(self, dataset, copy_from=copy_from)

    def sniff(self, filename):
        """
        Reads the start of the file (ignoring whitespace) looking for the
        required GATE header.

        :param filename: The name of the file to be checked.
        :return: True if filename is a GATE file, False otherwise.
        """
        log.info("LDC: Sniffing %s", filename)
        with open(filename, "r") as fh:
            for c in self.header:
                if c != self.read(fh):
                    return False

        log.info("Found a LDC file.")
        return True


class LifObject(object):

    """Auxiliary class to help determine the metadata for a LIF file."""

    def __init__(self, dataset):
        self.dataset = dataset
        self.json = json.load(open(dataset.file_name, "r"))
        self.meta = self.json['payload'].get('meta')
        self.views = self.json['payload']['views']

    def __str__(self):
        return "<LifObject on '%s'>" % self.dataset.file_name

    def declared_annotations(self, last_only=False):
        """Return the annotation content from all views using the metadata. Return only
        the content of the last view if last_only is True. Do not return duplicates."""
        idx = -1 if last_only else 0
        types = [view['metadata']['contains'].keys() for view in self.views[idx:]]
        # flatten the list of lists in types
        return [shorten(annotation) for annotation in set(itertools.chain.from_iterable(types))]

    def actual_annotations(self, last_only=False):
        """Collect the annotation content from all views using the actual
        annotations. Report on just the last view if last_only=True."""
        annotations = {}
        idx = -1 if last_only else 0
        for view in self.views[idx:]:
            for annotation in view['annotations']:
                annotype = shorten(annotation['@type'])
                annotations[annotype] = annotations.get(annotype, 0) + 1
        return annotations


def shorten(annotation_type):
    """Annotation types are URLs, just keep the last part because real estate in the
    Galaxy GUI is limited."""
    return annotation_type.split('/')[-1]

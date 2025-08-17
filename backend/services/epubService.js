// backend/services/epubService.js - Simple fallback version
const fs = require('fs-extra');
const path = require('path');
const AdmZip = require('adm-zip');

class EPubService {
  static async parseEpub(filePath) {
    try {
      // EPUB files are ZIP archives, so we can extract basic info
      const zip = new AdmZip(filePath);
      const entries = zip.getEntries();
      
      let metadata = {
        title: this.extractTitleFromFilename(filePath),
        author: 'Unknown Author',
        description: 'EPUB book uploaded successfully.',
        language: 'en',
        publisher: '',
        publishDate: new Date(),
        coverImage: null,
        tableOfContents: [],
        extractedText: 'Start reading to view content.'
      };
      
      // Try to find and parse content.opf for metadata
      const opfEntry = entries.find(entry => 
        entry.entryName.endsWith('.opf') || 
        entry.entryName.includes('content.opf')
      );
      
      if (opfEntry) {
        const opfContent = opfEntry.getData().toString('utf8');
        
        // Extract title
        const titleMatch = opfContent.match(/<dc:title[^>]*>([^<]+)<\/dc:title>/i);
        if (titleMatch) {
          metadata.title = titleMatch[1].trim();
        }
        
        // Extract author
        const authorMatch = opfContent.match(/<dc:creator[^>]*>([^<]+)<\/dc:creator>/i);
        if (authorMatch) {
          metadata.author = authorMatch[1].trim();
        }
        
        // Extract description
        const descMatch = opfContent.match(/<dc:description[^>]*>([^<]+)<\/dc:description>/i);
        if (descMatch) {
          metadata.description = descMatch[1].trim();
        }
        
        // Extract language
        const langMatch = opfContent.match(/<dc:language[^>]*>([^<]+)<\/dc:language>/i);
        if (langMatch) {
          metadata.language = langMatch[1].trim();
        }
      }
      
      // Try to find navigation files for table of contents
      const navEntries = entries.filter(entry => 
        entry.entryName.includes('nav') || 
        entry.entryName.includes('toc') ||
        entry.entryName.endsWith('.ncx')
      );
      
      if (navEntries.length > 0) {
        try {
          const navContent = navEntries[0].getData().toString('utf8');
          const tocMatches = navContent.match(/<navLabel>.*?<text>([^<]+)<\/text>/gi);
          
          if (tocMatches) {
            metadata.tableOfContents = tocMatches.map((match, index) => {
              const textMatch = match.match(/<text>([^<]+)<\/text>/i);
              return {
                title: textMatch ? textMatch[1] : `Chapter ${index + 1}`,
                href: '',
                chapter: index + 1
              };
            });
          }
        } catch (tocError) {
          console.log('Could not parse table of contents');
        }
      }
      
      // If no TOC found, create default chapters
      if (metadata.tableOfContents.length === 0) {
        // Estimate chapters based on HTML files
        const htmlEntries = entries.filter(entry => 
          entry.entryName.endsWith('.html') || 
          entry.entryName.endsWith('.xhtml')
        );
        
        const chapterCount = Math.max(1, htmlEntries.length);
        metadata.tableOfContents = Array.from({ length: chapterCount }, (_, i) => ({
          title: `Chapter ${i + 1}`,
          href: '',
          chapter: i + 1
        }));
      }
      
      // Try to extract cover image
      const imageEntries = entries.filter(entry => 
        (entry.entryName.includes('cover') || entry.entryName.includes('Cover')) &&
        (entry.entryName.endsWith('.jpg') || entry.entryName.endsWith('.jpeg') || entry.entryName.endsWith('.png'))
      );
      
      if (imageEntries.length > 0) {
        try {
          const coverData = imageEntries[0].getData();
          const coverPath = path.join(path.dirname(filePath), 'covers', 
            `${path.basename(filePath, '.epub')}-cover.jpg`);
          
          fs.ensureDirSync(path.dirname(coverPath));
          fs.writeFileSync(coverPath, coverData);
          metadata.coverImage = `/uploads/covers/${path.basename(coverPath)}`;
        } catch (coverError) {
          console.log('Could not extract cover image');
        }
      }
      
      return {
        metadata,
        totalChapters: metadata.tableOfContents.length,
        epub: null
      };
      
    } catch (error) {
      console.error('EPUB parsing error:', error);
      // Return basic metadata as fallback
      return {
        metadata: {
          title: this.extractTitleFromFilename(filePath),
          author: 'Unknown Author',
          description: 'EPUB file uploaded. Metadata extraction was limited.',
          language: 'en',
          publisher: '',
          publishDate: new Date(),
          coverImage: null,
          tableOfContents: [{ title: 'Chapter 1', href: '', chapter: 1 }],
          extractedText: 'Content available when reading.'
        },
        totalChapters: 1,
        epub: null
      };
    }
  }

  static async getChapterContent(epubPath, chapterIndex) {
    try {
      const zip = new AdmZip(epubPath);
      const entries = zip.getEntries();
      
      // Find HTML/XHTML files
      const htmlEntries = entries.filter(entry => 
        entry.entryName.endsWith('.html') || 
        entry.entryName.endsWith('.xhtml')
      ).sort((a, b) => a.entryName.localeCompare(b.entryName));
      
      if (htmlEntries[chapterIndex]) {
        const content = htmlEntries[chapterIndex].getData().toString('utf8');
        
        // Clean up the content - remove unnecessary tags but keep formatting
        let cleanContent = content
          .replace(/<\?xml[^>]*\?>/gi, '')
          .replace(/<!DOCTYPE[^>]*>/gi, '')
          .replace(/<html[^>]*>/gi, '<div>')
          .replace(/<\/html>/gi, '</div>')
          .replace(/<head>.*?<\/head>/gis, '')
          .replace(/<title>.*?<\/title>/gis, '')
          .replace(/<meta[^>]*>/gi, '')
          .replace(/<link[^>]*>/gi, '');
        
        return {
          title: `Chapter ${chapterIndex + 1}`,
          content: cleanContent || '<p>Chapter content could not be loaded.</p>',
          chapterIndex: chapterIndex
        };
      } else {
        return {
          title: `Chapter ${chapterIndex + 1}`,
          content: '<p>Chapter not found.</p>',
          chapterIndex: chapterIndex
        };
      }
      
    } catch (error) {
      console.error('Error loading chapter:', error);
      return {
        title: `Chapter ${chapterIndex + 1}`,
        content: '<p>Error loading chapter content.</p>',
        chapterIndex: chapterIndex
      };
    }
  }

  static extractTitleFromFilename(filePath) {
    const filename = path.basename(filePath, '.epub');
    // Remove user ID and timestamp prefixes
    const cleanFilename = filename.replace(/^\d+-\d+-/, '');
    // Replace underscores and hyphens with spaces, capitalize words
    return cleanFilename
      .replace(/[-_]/g, ' ')
      .replace(/\b\w/g, char => char.toUpperCase())
      .trim() || 'Untitled Book';
  }
}

module.exports = EPubService;
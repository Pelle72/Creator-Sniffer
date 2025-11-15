
import React from 'react';
import type { SearchResult } from '../types';
import { LinkIcon } from './icons/LinkIcon';

interface CommunityLinksProps {
  links: SearchResult[];
}

const getFaviconUrl = (url: string) => {
    try {
        const urlObj = new URL(url);
        return `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=16`;
    } catch (e) {
        return '';
    }
}

export const CommunityLinks: React.FC<CommunityLinksProps> = ({ links }) => {
  return (
    <div className="mt-5 pt-4 border-t border-gray-700">
      <h3 className="text-sm font-semibold text-gray-400 mb-3">Community Mentions &amp; Discussions:</h3>
      <ul className="space-y-2">
        {links.map((link, index) => {
            const faviconUrl = getFaviconUrl(link.uri);
            
            return (
                <li key={`${link.uri}-${index}`}>
                    <a
                        href={link.uri}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center p-2 rounded-md bg-gray-700/50 hover:bg-gray-700 transition-colors group"
                    >
                        {faviconUrl && <img src={faviconUrl} alt="" className="w-4 h-4 mr-3 rounded-sm flex-shrink-0" />}
                        <span className="text-gray-300 group-hover:text-indigo-300 text-sm truncate" title={link.title}>
                            {link.title || link.uri}
                        </span>
                        <LinkIcon className="h-4 w-4 ml-auto text-gray-500 group-hover:text-indigo-300 flex-shrink-0" />
                    </a>
                </li>
            )
        })}
      </ul>
    </div>
  );
};

// Sitemap Generator - Release 5A
// Sistema automático de geração de sitemap para SEO avançado

import { db } from './firebase-config.js';
import { collection, getDocs, query, where, orderBy } from 'https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js';

class SitemapGenerator {
    constructor() {
        this.baseUrl = window.location.hostname === 'localhost' ? 
            'http://localhost:3000' : 'https://belem-hb.web.app';
        this.sitemap = [];
        this.lastGenerated = null;
        this.staticPages = [
            {
                url: '/',
                changefreq: 'daily',
                priority: 1.0,
                lastmod: new Date().toISOString()
            },
            {
                url: '/admin.html',
                changefreq: 'weekly',
                priority: 0.5,
                lastmod: new Date().toISOString()
            },
            {
                url: '/login.html',
                changefreq: 'monthly',
                priority: 0.3,
                lastmod: new Date().toISOString()
            },
            {
                url: '/pwa-demo.html',
                changefreq: 'monthly',
                priority: 0.4,
                lastmod: new Date().toISOString()
            }
        ];
        
        this.init();
    }

    async init() {
        console.log('🗺️ Sitemap Generator initializing...');
        await this.generateSitemap();
        console.log('✅ Sitemap Generator initialized');
    }

    async generateSitemap() {
        console.log('📄 Generating enhanced sitemap...');
        
        try {
            const sitemap = {
                static: this.staticPages,
                dynamic: await this.getDynamicPages(),
                generatedAt: new Date().toISOString(),
                totalPages: 0
            };
            
            sitemap.totalPages = sitemap.static.length + sitemap.dynamic.length;
            
            // Generate XML
            const xml = this.generateSitemapXML(sitemap);
            
            // Generate robots.txt
            const robotsTxt = this.generateRobotsTxt();
            
            // Store in localStorage for demo
            localStorage.setItem('sitemap_xml', xml);
            localStorage.setItem('robots_txt', robotsTxt);
            localStorage.setItem('sitemap_data', JSON.stringify(sitemap));
            
            this.lastGenerated = new Date();
            console.log('✅ Enhanced sitemap generated successfully:', sitemap);
            
            return {
                success: true,
                sitemap: sitemap,
                xml: xml,
                robotsTxt: robotsTxt
            };
            
        } catch (error) {
            console.error('❌ Error generating sitemap:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async getDynamicPages() {
        const dynamicPages = [];
        
        try {
            // Get all published posts
            const postsQuery = query(
                collection(db, 'posts'),
                where('status', '==', 'published'),
                orderBy('createdAt', 'desc')
            );
            
            const postsSnapshot = await getDocs(postsQuery);
            
            postsSnapshot.forEach(doc => {
                const post = doc.data();
                dynamicPages.push({
                    url: `/post.html?id=${doc.id}`,
                    changefreq: 'weekly',
                    priority: 0.8,
                    lastmod: post.updatedAt ? 
                        new Date(post.updatedAt.seconds * 1000).toISOString() :
                        new Date(post.createdAt.seconds * 1000).toISOString(),
                    title: post.title,
                    category: post.category
                });
            });
            
            // Get all categories (could be dynamic category pages)
            const categories = [...new Set(
                postsSnapshot.docs.map(doc => doc.data().category).filter(Boolean)
            )];
            
            categories.forEach(category => {
                dynamicPages.push({
                    url: `/#categoria-${category.toLowerCase().replace(/\s+/g, '-')}`,
                    changefreq: 'weekly',
                    priority: 0.6,
                    lastmod: new Date().toISOString(),
                    title: `Categoria: ${category}`,
                    category: category
                });
            });
            
            console.log(`📄 Found ${dynamicPages.length} dynamic pages`);
            
        } catch (error) {
            console.error('❌ Error fetching dynamic pages:', error);
        }
        
        return dynamicPages;
    }

    generateSitemapXML(sitemap) {
        const allPages = [...sitemap.static, ...sitemap.dynamic];
        
        let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
                            http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
`;

        allPages.forEach(page => {
            xml += `  <url>
    <loc>${this.baseUrl}${page.url}</loc>
    <lastmod>${page.lastmod}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
`;
            
            // Add news sitemap data for posts
            if (page.url.includes('post.html') && page.category) {
                xml += `    <news:news>
      <news:publication>
        <news:name>Arquidiocese de Belém do Pará</news:name>
        <news:language>pt</news:language>
      </news:publication>
      <news:publication_date>${page.lastmod}</news:publication_date>
      <news:title><![CDATA[${page.title || 'Arquidiocese de Belém'}]]></news:title>
      <news:keywords>${page.category}, Arquidiocese, Belém, Igreja</news:keywords>
    </news:news>
`;
            }
            
            xml += `  </url>
`;
        });

        xml += '</urlset>';
        
        return xml;
    }

    generateRobotsTxt() {
        return `User-agent: *
Allow: /

# Sitemaps
Sitemap: ${this.baseUrl}/sitemap.xml

# Crawl delay (optional)
Crawl-delay: 1

# Disallow admin areas
Disallow: /admin.html
Disallow: /login.html

# Allow important pages
Allow: /
Allow: /post.html
Allow: /pwa-demo.html

# Cache policy for crawlers
# Cache-delay: 86400

# Generated by Arquidiocese SEO Manager
# Generated at: ${new Date().toISOString()}
`;
    }

    async refreshSitemap() {
        console.log('🔄 Refreshing sitemap...');
        return await this.generateSitemap();
    }

    addStaticPages() {
        const staticPages = [
            {
                url: this.baseUrl + '/',
                lastmod: new Date().toISOString().split('T')[0],
                changefreq: 'daily',
                priority: 1.0
            },
            {
                url: this.baseUrl + '/index.html',
                lastmod: new Date().toISOString().split('T')[0],
                changefreq: 'daily',
                priority: 1.0
            },
            {
                url: this.baseUrl + '/login.html',
                lastmod: new Date().toISOString().split('T')[0],
                changefreq: 'monthly',
                priority: 0.3
            },
            {
                url: this.baseUrl + '/pwa-demo.html',
                lastmod: new Date().toISOString().split('T')[0],
                changefreq: 'monthly',
                priority: 0.5
            }
        ];

        this.sitemap.push(...staticPages);
    }

    async addDynamicPages() {
        try {
            // Get all published posts
            const postsQuery = query(
                collection(this.db, 'posts'),
                where('status', '==', 'published'),
                orderBy('createdAt', 'desc')
            );
            
            const querySnapshot = await getDocs(postsQuery);
            
            querySnapshot.forEach((doc) => {
                const post = doc.data();
                const postDate = this.formatFirebaseDate(post.updatedAt || post.createdAt);
                
                this.sitemap.push({
                    url: `${this.baseUrl}/post.html?id=${doc.id}`,
                    lastmod: postDate,
                    changefreq: this.getChangeFrequency(post.category),
                    priority: this.getPriority(post.category, post.priority)
                });
            });
            
            console.log(`📝 Added ${querySnapshot.size} posts to sitemap`);
        } catch (error) {
            console.error('Error fetching posts for sitemap:', error);
        }
    }

    formatFirebaseDate(timestamp) {
        if (!timestamp) return new Date().toISOString().split('T')[0];
        
        let date;
        if (timestamp.seconds) {
            date = new Date(timestamp.seconds * 1000);
        } else {
            date = new Date(timestamp);
        }
        
        return date.toISOString().split('T')[0];
    }

    getChangeFrequency(category) {
        const frequencies = {
            'noticias': 'weekly',
            'comunicados': 'monthly',
            'decretos': 'yearly',
            'homilias': 'monthly'
        };
        
        return frequencies[category] || 'monthly';
    }

    getPriority(category, priority) {
        let basePriority = 0.7;
        
        // Adjust by category
        const categoryPriorities = {
            'noticias': 0.8,
            'comunicados': 0.9,
            'decretos': 0.9,
            'homilias': 0.7
        };
        
        basePriority = categoryPriorities[category] || 0.7;
        
        // Adjust by post priority
        if (priority === 'high') {
            basePriority = Math.min(basePriority + 0.1, 1.0);
        } else if (priority === 'low') {
            basePriority = Math.max(basePriority - 0.1, 0.1);
        }
        
        return basePriority;
    }

    generateXML() {
        const urlElements = this.sitemap.map(page => `
    <url>
        <loc>${this.escapeXml(page.url)}</loc>
        <lastmod>${page.lastmod}</lastmod>
        <changefreq>${page.changefreq}</changefreq>
        <priority>${page.priority}</priority>
    </url>`).join('');

        return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    <!-- Generated automatically by Arquidiocese de Belém do Pará CMS -->
    <!-- Last updated: ${new Date().toISOString()} -->
${urlElements}
</urlset>`;
    }

    escapeXml(str) {
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    async downloadSitemap() {
        try {
            const xml = await this.generateSitemap();
            
            const blob = new Blob([xml], { type: 'application/xml' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = 'sitemap.xml';
            a.click();
            
            URL.revokeObjectURL(url);
            
            return xml;
        } catch (error) {
            console.error('Error downloading sitemap:', error);
            throw error;
        }
    }

    getSitemapInfo() {
        return {
            totalUrls: this.sitemap.length,
            lastGenerated: this.lastGenerated,
            baseUrl: this.baseUrl
        };
    }

    // Method to be called from admin panel
    async refreshSitemap() {
        try {
            const xml = await this.generateSitemap();
            
            // In a real implementation, you would upload this to your hosting
            // For now, we'll just return the XML and log instructions
            console.log('📋 Sitemap XML generated. In production, this should be uploaded to:', this.baseUrl + '/sitemap.xml');
            
            return {
                success: true,
                xml: xml,
                info: this.getSitemapInfo(),
                instructions: 'Upload this XML content to your web server as sitemap.xml in the root directory.'
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }
}

// Export and create global instance
const sitemapGenerator = new SitemapGenerator();
window.sitemapGenerator = sitemapGenerator;

export default SitemapGenerator;

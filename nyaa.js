// ==MiruExtension==
// @name        Nyaa
// @version     v0.1.0
// @author      yukidarumasandesu
// @lang        en
// @package     nyaa
// @type        bangumi
// @webSite     https://nyaa.si
// @description Simple Nyaa torrent search & streaming source for Hayase
// ==/MiruExtension==


export default class extends Extension {
  /**
   * Build a tiny filter menu (optional).
   * Delete this createFilter() method if you don’t need custom filters.
   */
  async createFilter() {
    return {
      sort: {
        title: "Sort by",
        max : 1,
        min : 1,
        default: "&s=seeders",
        options: {
          "&s=seeders" : "Seeders",
          "&s=leechers": "Leechers",
          "&s=size"    : "Size",
          ""           : "None"
        }
      },
      order: {
        title: "Order",
        max : 1,
        min : 1,
        default: "&o=desc",
        options: {
          "&o=desc": "Descending",
          "&o=asc" : "Ascending"
        }
      }
    };
  }

  /** Latest torrents = a blank search on the first page */
  async latest(page) {
    return this._scrape("", page);
  }

  /** Keyword search */
  async search(query, page = 1, filter = {}) {
    const extra = (filter.sort ?? "") + (filter.order ?? "");
    return this._scrape(query, page, extra);
  }

  /** Detail page → grab the magnet link */
  async detail(relUrl) {
    const html   = await this.request(relUrl);
    const magnet = html.match(/href="(magnet:[^"]+)"/)?.[1];
    const title  = html.match(/<title>(.*?)\s*\|/)?.[1] ?? "Nyaa torrent";

    return {
      title,
      episodes: [
        {
          title: "Magnet",
          urls : [{ name: title, url: magnet }]
        }
      ]
    };
  }

  /** Watch = tell Hayase to stream the magnet */
  async watch(url) {
    return { type: "torrent", url };
  }

  /* ---------- private helpers ---------- */

  async _scrape(query = "", page = 1, extra = "") {
    const url  = `/?f=0&c=1_0&q=${encodeURIComponent(query)}&p=${page}${extra}`;
    const html = await this.request(url);

    // Each torrent row has class="default"
    const rows = html.match(/<tr class="default"[\s\S]+?<\/tr>/g) ?? [];

    return rows.map(row => {
      const title    = row.match(/title="([^"]+)"/)?.[1] ?? "Untitled";
      const relUrl   = row.match(/href="(\/view\/\d+)"/)?.[1]  ?? "";
      const seeders  = row.match(/<td class="text-success">(\d+)<\/td>/)?.[1] ?? "0";
      const leechers = row.match(/<td class="text-danger">(\d+)<\/td>/)?.[1] ?? "0";

      return {
        title,
        url   : relUrl,
        update: `Seeders: ${seeders} | Leechers: ${leechers}`
      };
    });
  }
}

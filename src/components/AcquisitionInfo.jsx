import React from 'react';
import { Megaphone, Globe, Link, MapPin } from 'lucide-react';

const formatSource = (source) => {
  if (!source) return null;
  const map = {
    'ig': 'Instagram',
    'instagram': 'Instagram',
    'fb': 'Facebook',
    'facebook': 'Facebook',
    'twitter': 'Twitter/X',
    'x': 'Twitter/X',
    'google': 'Google',
    'tiktok': 'TikTok',
    'youtube': 'YouTube',
    'yt': 'YouTube',
    'reddit': 'Reddit',
  };
  return map[source.toLowerCase()] || source;
};

const formatReferrer = (domain) => {
  if (!domain) return null;
  const map = {
    't.co': 'Twitter/X',
    'twitter.com': 'Twitter/X',
    'x.com': 'Twitter/X',
    'facebook.com': 'Facebook',
    'l.facebook.com': 'Facebook',
    'lm.facebook.com': 'Facebook',
    'instagram.com': 'Instagram',
    'l.instagram.com': 'Instagram',
    'google.com': 'Google',
    'youtube.com': 'YouTube',
    'tiktok.com': 'TikTok',
    'reddit.com': 'Reddit',
    'discord.com': 'Discord',
    'discord.gg': 'Discord',
  };
  return map[domain.toLowerCase()] || domain;
};

const formatMedium = (medium) => {
  if (!medium) return null;
  const map = {
    'cpc': 'Paid Search',
    'paid': 'Paid',
    'paidsocial': 'Paid Social',
    'paid_social': 'Paid Social',
    'social': 'Social',
    'organic': 'Organic',
    'email': 'Email',
    'referral': 'Referral',
  };
  return map[medium.toLowerCase()] || medium;
};

const AcquisitionInfo = ({ acquisition }) => {
  if (!acquisition) return null;

  const { utm_source, utm_medium, utm_campaign, referring_domain, country, city } = acquisition;

  // Build display parts
  const source = formatSource(utm_source);
  const medium = formatMedium(utm_medium);
  const hasChannel = source || medium;
  const hasLocation = country;
  const hasCampaign = utm_campaign && utm_campaign !== 'unknown';
  const hasReferrer = referring_domain && referring_domain !== 'direct' && referring_domain !== '$direct';

  if (!hasChannel && !hasLocation && !hasCampaign && !hasReferrer) return null;

  return (
    <div className="mb-6 bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
      <span className="text-indigo-400 font-medium text-xs uppercase tracking-wide">Acquired via</span>

      {hasChannel && (
        <span className="flex items-center gap-1.5 text-slate-700">
          <Megaphone size={14} className="text-indigo-400" />
          <span className="font-medium">{source}{source && medium ? ' / ' : ''}{medium}</span>
        </span>
      )}

      {hasCampaign && (
        <span className="flex items-center gap-1.5 text-slate-700">
          <Globe size={14} className="text-indigo-400" />
          <span className="font-medium">{utm_campaign}</span>
        </span>
      )}

      {hasReferrer && (
        <span className="flex items-center gap-1.5 text-slate-700">
          <Link size={14} className="text-indigo-400" />
          <span className="font-medium">{formatReferrer(referring_domain)}</span>
        </span>
      )}

      {hasLocation && (
        <span className="flex items-center gap-1.5 text-slate-600">
          <MapPin size={14} className="text-indigo-400" />
          <span>{city && city !== country ? `${city}, ` : ''}{country}</span>
        </span>
      )}
    </div>
  );
};

export default AcquisitionInfo;

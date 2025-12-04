const https = require('https');

const URL = 'https://www.npo3fm.nl/kominactie/acties/maasland-merry-miles';

https.get(URL, res => {
  let html = '';
  res.on('data', c => html += c);
  res.on('end', () => {
    const match = html.match(/<script id="__NEXT_DATA__"[^>]*>(.+?)<\/script>/);
    if (!match) {
      console.error('No __NEXT_DATA__ found');
      return;
    }

    const data = JSON.parse(match[1]);
    const campaign = data.props.pageProps.campaign;

    console.log('Campaign keys:', Object.keys(campaign));
    console.log('\nCampaign structure:');
    console.log(JSON.stringify(campaign, null, 2).substring(0, 2000));
  });
}).on('error', console.error);

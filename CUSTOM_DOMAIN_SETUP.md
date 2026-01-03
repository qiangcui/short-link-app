# Custom Domain Setup Guide

This guide will help you connect your custom domain to Firebase Hosting.

## Prerequisites

- A domain name registered with a domain registrar (e.g., GoDaddy, Namecheap, Google Domains, etc.)
- Access to your domain's DNS settings

## Step-by-Step Instructions

### Method 1: Using Firebase Console (Recommended)

1. **Go to Firebase Console**
   - Visit: https://console.firebase.google.com/project/studio-2322411817-7e29b/hosting
   - Or navigate to: Project → Hosting → Add custom domain

2. **Add Your Custom Domain**
   - Click "Add custom domain" button
   - Enter your domain (e.g., `shortlink.com` or `www.shortlink.com`)
   - Click "Continue"

3. **Verify Domain Ownership**
   - Firebase will provide you with DNS records to add
   - You'll need to add a TXT record to verify ownership
   - Example TXT record:
     ```
     Type: TXT
     Name: @ (or leave blank, depending on your DNS provider)
     Value: firebase=studio-2322411817-7e29b
     ```

4. **Add DNS Records**
   Firebase will provide you with two options:

   **Option A: A Record (Root Domain)**
   ```
   Type: A
   Name: @
   Value: 151.101.1.195
   Value: 151.101.65.195
   ```
   (Add both A records - Firebase will provide the exact IPs)

   **Option B: CNAME Record (Subdomain)**
   ```
   Type: CNAME
   Name: www (or your subdomain)
   Value: studio-2322411817-7e29b.web.app
   ```

5. **Update DNS at Your Domain Registrar**
   - Log in to your domain registrar (GoDaddy, Namecheap, etc.)
   - Navigate to DNS Management
   - Add the records provided by Firebase
   - Save changes

6. **Wait for DNS Propagation**
   - DNS changes can take 24-48 hours to propagate
   - Firebase will automatically detect when DNS is configured correctly
   - You'll see a green checkmark when verification is complete

7. **SSL Certificate**
   - Firebase automatically provisions SSL certificates via Let's Encrypt
   - This happens automatically after DNS verification
   - Your site will be available at `https://yourdomain.com`

### Method 2: Using Firebase CLI

```bash
# Add custom domain
firebase hosting:sites:create your-domain-com

# Or add domain to existing site
firebase hosting:channel:deploy production --only hosting
```

## Common DNS Provider Instructions

### GoDaddy
1. Log in → My Products → DNS
2. Click "Add" to add new records
3. Add the A records or CNAME provided by Firebase

### Namecheap
1. Log in → Domain List → Manage → Advanced DNS
2. Add new records in the Host Records section
3. Save changes

### Google Domains
1. Log in → DNS → Custom resource records
2. Add the records provided by Firebase
3. Save

### Cloudflare
1. Log in → Select your domain → DNS
2. Add the records (make sure proxy is OFF for A records)
3. Save

## Important Notes

1. **Your App Will Auto-Update**
   - Your app uses `window.location.origin` and `window.location.hostname`
   - Once the domain is connected, all short links will automatically use the new domain
   - No code changes needed!

2. **Both www and non-www**
   - You can add both `yourdomain.com` and `www.yourdomain.com`
   - Firebase will handle redirects automatically
   - Choose one as primary in Firebase Console

3. **SSL Certificate**
   - Firebase automatically provides free SSL certificates
   - HTTPS will be enabled automatically
   - Certificate renewal is automatic

4. **DNS Propagation Time**
   - Changes can take 24-48 hours
   - Use tools like `dig` or online DNS checkers to verify:
     ```bash
     dig yourdomain.com
     ```

## Troubleshooting

### Domain Not Verifying
- Double-check DNS records are correct
- Wait 24-48 hours for propagation
- Use `dig` or `nslookup` to verify records are live

### SSL Certificate Issues
- Wait for automatic provisioning (can take a few hours)
- Check Firebase Console for certificate status
- Ensure DNS is fully propagated first

### App Not Loading on Custom Domain
- Verify DNS records are correct
- Check Firebase Console for any errors
- Clear browser cache
- Try incognito/private browsing mode

## After Setup

Once your domain is connected:
- Your app will be available at `https://yourdomain.com`
- Short links will automatically use your domain
- Example: `https://yourdomain.com/abc123`

## Support

- Firebase Hosting Docs: https://firebase.google.com/docs/hosting/custom-domain
- Firebase Support: https://firebase.google.com/support


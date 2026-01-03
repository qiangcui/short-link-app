# ACME Challenge Error Troubleshooting

## Error: "One or more of Hosting's HTTP GET request for the ACME challenge failed: 404 Not Found"

This error occurs when Firebase tries to verify your domain ownership for SSL certificate provisioning but can't access the challenge file.

## Common Causes & Solutions

### 1. DNS Records Not Properly Configured

**Problem:** Your domain's DNS records aren't pointing to Firebase Hosting correctly.

**Solution:**
- Verify your DNS records are correct in Firebase Console
- Check that A records or CNAME records are properly set
- Wait for DNS propagation (can take 24-48 hours)

**How to Check:**
```bash
# Check A records
dig yourdomain.com
nslookup yourdomain.com

# Check CNAME records
dig www.yourdomain.com CNAME
```

### 2. Domain Not Fully Propagated

**Problem:** DNS changes haven't propagated yet.

**Solution:**
- Wait 24-48 hours after adding DNS records
- Use online DNS checkers to verify propagation globally
- Check from multiple locations: https://www.whatsmydns.net/

### 3. Incorrect DNS Record Values

**Problem:** The DNS records you added don't match what Firebase expects.

**Solution:**
1. Go to Firebase Console → Hosting → Your custom domain
2. Check the exact DNS records Firebase expects
3. Verify your DNS records match exactly
4. For A records, you need ALL the IPs Firebase provides (usually 2-4 IPs)

### 4. Firewall or Security Settings Blocking

**Problem:** Your domain registrar or hosting provider is blocking Firebase's verification requests.

**Solution:**
- Check if your domain has any firewall rules
- Temporarily disable any security features that might block HTTP requests
- Ensure port 80 (HTTP) is accessible for the ACME challenge

### 5. Domain Already in Use Elsewhere

**Problem:** Your domain might be pointing to another service.

**Solution:**
- Check if your domain is pointing to another hosting service
- Remove any conflicting DNS records
- Ensure only Firebase DNS records are active

## Step-by-Step Fix

### Step 1: Verify DNS Records

1. Go to Firebase Console: https://console.firebase.google.com/project/studio-2322411817-7e29b/hosting
2. Click on your custom domain
3. Check the "DNS Configuration" section
4. Note the exact records Firebase expects

### Step 2: Check Your DNS Provider

1. Log in to your domain registrar (GoDaddy, Namecheap, etc.)
2. Go to DNS Management
3. Verify the records match exactly what Firebase shows
4. For A records, ensure ALL IPs are added (not just one)

### Step 3: Remove and Re-add Domain (if needed)

If DNS is correct but still failing:

1. In Firebase Console, remove the custom domain
2. Wait 5-10 minutes
3. Add the domain again
4. Follow the setup process from scratch

### Step 4: Verify DNS Propagation

Use these tools to check if DNS is propagated:
- https://www.whatsmydns.net/
- https://dnschecker.org/

Enter your domain and check if it resolves to Firebase's IPs globally.

### Step 5: Test HTTP Access

The ACME challenge requires HTTP access. Test if your domain is accessible:

```bash
# Test HTTP access (should return 200 or redirect)
curl -I http://yourdomain.com

# Check if challenge path is accessible
curl http://yourdomain.com/.well-known/acme-challenge/test
```

## Firebase Console Actions

### Retry SSL Certificate Provisioning

1. Go to Firebase Console → Hosting → Your custom domain
2. Look for "Retry" or "Verify" button
3. Click to retry the SSL certificate provisioning

### Check Domain Status

In Firebase Console, you should see:
- ✅ Domain verified (green checkmark)
- ⏳ SSL certificate provisioning (in progress)
- ❌ Error (if verification failed)

## Alternative: Use Firebase CLI

If the console isn't working, try CLI:

```bash
# Check domain status
firebase hosting:sites:get your-domain-com

# Or check hosting configuration
firebase hosting:channel:list
```

## Important Notes

1. **HTTP Must Be Accessible**: The ACME challenge uses HTTP (port 80), not HTTPS. Ensure HTTP is accessible.

2. **Wait Time**: After fixing DNS, wait at least 1-2 hours before retrying. DNS propagation takes time.

3. **Multiple IPs**: If Firebase provides multiple A record IPs, you MUST add ALL of them, not just one.

4. **CNAME vs A Records**: 
   - Use A records for root domain (`yourdomain.com`)
   - Use CNAME for subdomains (`www.yourdomain.com`)

## Still Not Working?

If you've tried everything:

1. **Contact Firebase Support**: https://firebase.google.com/support
2. **Check Firebase Status**: https://status.firebase.google.com/
3. **Verify Domain Registrar**: Some registrars have special requirements

## Example: Correct DNS Setup

**For root domain (`shortlink.com`):**
```
Type: A
Name: @
Value: 151.101.1.195
TTL: 3600

Type: A
Name: @
Value: 151.101.65.195
TTL: 3600
```

**For subdomain (`www.shortlink.com`):**
```
Type: CNAME
Name: www
Value: studio-2322411817-7e29b.web.app
TTL: 3600
```

Make sure ALL records match exactly what Firebase provides in the console.


'use server';

import { promises as fs } from 'fs';
import path from 'path';
import { revalidatePath } from 'next/cache';

const getFilePath = () => path.join(process.cwd(), 'lib', 'marketing-data.json');

export interface ReferralSettings {
  isEnabled: boolean;
  rewardAmount: number;
}

export interface ReferralRow {
  id: string;
  referrerName: string;
  referrerEmail: string;
  referralCode: string;
  refereeName: string;
  refereeEmail: string;
  status: 'pending' | 'completed';
  rewardDisbursed: number;
  date: string;
}

export interface CouponRow {
  id: string;
  code: string;
  type: 'percent' | 'fixed';
  value: number;
  maxUses: number;
  currentUses: number;
  expiresAt: string;
  isActive: boolean;
}

export interface MarketingData {
  referralSettings: ReferralSettings;
  referrals: ReferralRow[];
  coupons: CouponRow[];
}

// Read database
export async function getMarketingDataAction(): Promise<MarketingData> {
  try {
    const file = await fs.readFile(getFilePath(), 'utf8');
    return JSON.parse(file);
  } catch (err) {
    console.error('Error reading marketing data:', err);
    return {
      referralSettings: { isEnabled: true, rewardAmount: 500 },
      referrals: [],
      coupons: [],
    };
  }
}

// Write database
async function writeStore(data: MarketingData): Promise<void> {
  await fs.writeFile(getFilePath(), JSON.stringify(data, null, 2), 'utf8');
}

// 1. Update referral program status
export async function updateReferralSettingsAction(isEnabled: boolean, rewardAmount: number): Promise<{ success: boolean; error?: string }> {
  try {
    const db = await getMarketingDataAction();
    db.referralSettings = { isEnabled, rewardAmount };
    await writeStore(db);
    revalidatePath('/admin/marketing');
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to update referral configurations';
    return { success: false, error: msg };
  }
}

// 2. Save coupon (Add/Edit)
export async function saveCouponAction(coupon: CouponRow): Promise<{ success: boolean; error?: string }> {
  try {
    const db = await getMarketingDataAction();
    
    // Validation
    if (!coupon.code.trim()) return { success: false, error: 'Coupon code cannot be empty.' };
    if (coupon.value <= 0) return { success: false, error: 'Discount value must be greater than zero.' };

    const codeUpper = coupon.code.trim().toUpperCase();
    coupon.code = codeUpper;

    const idx = db.coupons.findIndex(c => c.id === coupon.id);
    if (idx >= 0) {
      db.coupons[idx] = coupon;
    } else {
      // Check duplicate
      const exists = db.coupons.some(c => c.code === codeUpper);
      if (exists) return { success: false, error: `Coupon code '${codeUpper}' already exists.` };
      db.coupons.push(coupon);
    }

    await writeStore(db);
    revalidatePath('/admin/marketing');
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Coupon save failed';
    return { success: false, error: msg };
  }
}

// 3. Delete coupon
export async function deleteCouponAction(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const db = await getMarketingDataAction();
    db.coupons = db.coupons.filter(c => c.id !== id);
    await writeStore(db);
    revalidatePath('/admin/marketing');
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Coupon delete failed';
    return { success: false, error: msg };
  }
}

// 4. Toggle coupon active status
export async function toggleCouponStatusAction(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const db = await getMarketingDataAction();
    const coupon = db.coupons.find(c => c.id === id);
    if (coupon) {
      coupon.isActive = !coupon.isActive;
      await writeStore(db);
      revalidatePath('/admin/marketing');
    }
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to toggle coupon status';
    return { success: false, error: msg };
  }
}

// 5. Submit a new referral
export async function addReferralAction(referrerEmail: string, refereeName: string, refereeEmail: string): Promise<{ success: boolean; error?: string }> {
  try {
    const db = await getMarketingDataAction();
    if (!db.referralSettings.isEnabled) {
      return { success: false, error: 'The referral program is currently deactivated.' };
    }

    // Simple code generator based on referrer name prefix
    const code = `${referrerEmail.split('@')[0].toUpperCase()}${Math.floor(100 + Math.random() * 900)}`;

    const newRef: ReferralRow = {
      id: `ref-${Date.now()}`,
      referrerName: referrerEmail.split('@')[0],
      referrerEmail: referrerEmail.trim().toLowerCase(),
      referralCode: code,
      refereeName: refereeName.trim(),
      refereeEmail: refereeEmail.trim().toLowerCase(),
      status: 'pending',
      rewardDisbursed: 0,
      date: new Date().toISOString().slice(0, 10),
    };

    db.referrals.push(newRef);
    await writeStore(db);
    revalidatePath('/admin/marketing');
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Referral submit failed';
    return { success: false, error: msg };
  }
}

// 6. Complete a referral (marks completed and awards credits)
export async function completeReferralAction(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const db = await getMarketingDataAction();
    const ref = db.referrals.find(r => r.id === id);
    if (ref && ref.status === 'pending') {
      ref.status = 'completed';
      ref.rewardDisbursed = db.referralSettings.rewardAmount;
      await writeStore(db);
      revalidatePath('/admin/marketing');
    }
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Referral update failed';
    return { success: false, error: msg };
  }
}

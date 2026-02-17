import { Router } from 'express';
import { locationService } from '../services/locationService';

const router = Router();

// LGD Village Search
router.get('/lgd/villages/search', async (req, res) => {
  try {
    const { q, limit = 20 } = req.query;

    if (!q || typeof q !== 'string') {
      return res.status(400).json({
        success: false,
        error: { message: 'Search query (q) is required' },
      });
    }

    const villages = await locationService.searchLGDVillages(q, Number(limit));

    res.json({
      success: true,
      data: villages,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { message: error.message || 'Failed to search villages' },
    });
  }
});

// Get default country
router.get('/countries/default', async (req, res) => {
  try {
    const country = await locationService.getDefaultCountry();
    res.json({
      success: true,
      data: country,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { message: error.message || 'Failed to get default country' },
    });
  }
});

export default router;

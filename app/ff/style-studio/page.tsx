'use client';

/**
 * FF AI STYLE STUDIO - Main Page
 * Personal styling platform with body scanning, color analysis, and custom design
 *
 * MAGGIE-ONLY FEATURE
 */

import { useState, useEffect } from 'react';
// TODO: Enable these when 3D features are ready
// import DesignCanvas from '@/app/components/ff/DesignCanvas';
// import ThreeDPreviewViewer from '@/app/components/ff/ThreeDPreviewViewer';

export default function FFStyleStudioPage() {
  const [activeTab, setActiveTab] = useState<'scan' | 'color' | 'design' | 'closet'>('scan');
  const [userProfile, setUserProfile] = useState<any>(null);
  const [bodyMeasurements, setBodyMeasurements] = useState<any>(null);
  const [colorProfile, setColorProfile] = useState<any>(null);
  const [currentDesign, setCurrentDesign] = useState<any>(null);

  // Temporary user ID (in production, get from auth)
  const userId = 'temp-user-id';

  useEffect(() => {
    // Load user data
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      // Load body measurements
      const bodyRes = await fetch(`/api/ff/body-scan?userId=${userId}`);
      const bodyData = await bodyRes.json();
      if (bodyData.hasMeasurements) {
        setBodyMeasurements(bodyData.data);
      }

      // Load color profile
      const colorRes = await fetch(`/api/ff/color-analysis?userId=${userId}`);
      const colorData = await colorRes.json();
      if (colorData.hasProfile) {
        setColorProfile(colorData.data);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f8f6f3'
    }}>
      {/* Header */}
      <header style={{
        backgroundColor: '#1a3a2f',
        color: '#e8dcc4',
        padding: '2rem',
        textAlign: 'center'
      }}>
        <h1 style={{
          fontSize: '2.5rem',
          fontFamily: 'serif',
          marginBottom: '0.5rem'
        }}>
          FF AI Style Studio
        </h1>
        <p style={{
          fontSize: '1.1rem',
          color: '#c9a962',
          fontStyle: 'italic'
        }}>
          Your Personal Styling Assistant
        </p>
        <p style={{
          fontSize: '0.9rem',
          color: '#e8dcc4',
          marginTop: '0.5rem',
          opacity: 0.8
        }}>
          Maggie-Only Feature • Powered by Natural Fiber Frequency Science
        </p>
      </header>

      {/* Navigation Tabs */}
      <nav style={{
        backgroundColor: '#fff',
        borderBottom: '2px solid #1a3a2f',
        display: 'flex',
        justifyContent: 'center',
        gap: '2rem',
        padding: '1rem 2rem'
      }}>
        {[
          { id: 'scan', label: 'Body Scan', icon: '📏' },
          { id: 'color', label: 'Color Analysis', icon: '🎨' },
          { id: 'design', label: 'Design Studio', icon: '✨' },
          { id: 'closet', label: 'Virtual Closet', icon: '👗' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            style={{
              padding: '0.75rem 1.5rem',
              fontSize: '1rem',
              backgroundColor: activeTab === tab.id ? '#1a3a2f' : 'transparent',
              color: activeTab === tab.id ? '#fff' : '#1a3a2f',
              border: activeTab === tab.id ? 'none' : '2px solid #1a3a2f',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'all 0.3s'
            }}
          >
            <span style={{ marginRight: '0.5rem' }}>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </nav>

      {/* Content Area */}
      <main style={{
        maxWidth: '1400px',
        margin: '2rem auto',
        padding: '0 2rem'
      }}>
        {/* Body Scan Tab */}
        {activeTab === 'scan' && (
          <div>
            <h2 style={{
              fontSize: '2rem',
              color: '#1a3a2f',
              marginBottom: '1.5rem'
            }}>
              Body Scan & Measurements
            </h2>

            {bodyMeasurements ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                {/* Measurements Display */}
                <div style={{
                  backgroundColor: '#fff',
                  padding: '2rem',
                  borderRadius: '12px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                }}>
                  <h3 style={{ color: '#1a3a2f', marginBottom: '1rem' }}>Your Measurements</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    {[
                      { label: 'Bust', value: bodyMeasurements.bust },
                      { label: 'Waist', value: bodyMeasurements.waist },
                      { label: 'Hips', value: bodyMeasurements.hips },
                      { label: 'Height', value: bodyMeasurements.height_inches }
                    ].map(item => (
                      <div key={item.label}>
                        <div style={{ fontSize: '0.85rem', color: '#666' }}>{item.label}</div>
                        <div style={{ fontSize: '1.5rem', color: '#1a3a2f', fontWeight: 'bold' }}>
                          {item.value}"
                        </div>
                      </div>
                    ))}
                  </div>

                  <div style={{
                    marginTop: '2rem',
                    padding: '1rem',
                    backgroundColor: '#f8f6f3',
                    borderRadius: '8px'
                  }}>
                    <strong style={{ color: '#c9a962' }}>Body Type:</strong>
                    <span style={{ marginLeft: '1rem', textTransform: 'capitalize' }}>
                      {bodyMeasurements.body_type?.replace('_', ' ')}
                    </span>
                  </div>

                  {bodyMeasurements.recommended_silhouettes && (
                    <div style={{ marginTop: '1.5rem' }}>
                      <h4 style={{ color: '#1a3a2f', marginBottom: '0.5rem' }}>Best Silhouettes:</h4>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                        {bodyMeasurements.recommended_silhouettes.map((s: string) => (
                          <span key={s} style={{
                            padding: '0.4rem 0.8rem',
                            backgroundColor: '#1a3a2f',
                            color: '#fff',
                            borderRadius: '20px',
                            fontSize: '0.85rem',
                            textTransform: 'capitalize'
                          }}>
                            {s.replace('_', ' ')}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* 3D Preview */}
                <div style={{
                  backgroundColor: '#f8f8f8',
                  padding: '3rem',
                  borderRadius: '12px',
                  textAlign: 'center',
                  border: '2px dashed #ddd'
                }}>
                  <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎨</div>
                  <h3 style={{ color: '#666', marginBottom: '0.5rem' }}>3D Preview Coming Soon</h3>
                  <p style={{ color: '#999' }}>Interactive 3D garment visualization will be available here</p>
                </div>
              </div>
            ) : (
              <div style={{
                backgroundColor: '#fff',
                padding: '3rem',
                borderRadius: '12px',
                textAlign: 'center',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
              }}>
                <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📸</div>
                <h3 style={{ color: '#1a3a2f', marginBottom: '1rem' }}>Get Your Body Scan</h3>
                <p style={{ color: '#666', marginBottom: '2rem' }}>
                  Upload a full-body photo to get AI-powered measurements and body type analysis
                </p>
                <button style={{
                  padding: '1rem 2rem',
                  fontSize: '1.1rem',
                  backgroundColor: '#c9a962',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}>
                  Upload Photo
                </button>
                <p style={{ fontSize: '0.85rem', color: '#999', marginTop: '1rem' }}>
                  API endpoint ready at /api/ff/body-scan
                </p>
              </div>
            )}
          </div>
        )}

        {/* Color Analysis Tab */}
        {activeTab === 'color' && (
          <div>
            <h2 style={{
              fontSize: '2rem',
              color: '#1a3a2f',
              marginBottom: '1.5rem'
            }}>
              Personal Color Analysis
            </h2>

            {colorProfile ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                {/* Color Profile */}
                <div style={{
                  backgroundColor: '#fff',
                  padding: '2rem',
                  borderRadius: '12px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                }}>
                  <h3 style={{ color: '#1a3a2f', marginBottom: '1rem' }}>Your Color Season</h3>

                  <div style={{
                    padding: '1.5rem',
                    backgroundColor: '#f8f6f3',
                    borderRadius: '8px',
                    marginBottom: '1.5rem',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem', textTransform: 'capitalize' }}>
                      {colorProfile.color_season}
                    </div>
                    <div style={{ fontSize: '1rem', color: '#666', textTransform: 'capitalize' }}>
                      {colorProfile.color_season_subtype?.replace('_', ' ')}
                    </div>
                  </div>

                  <div style={{ marginBottom: '1.5rem' }}>
                    <strong>Undertone:</strong>
                    <span style={{ marginLeft: '1rem', textTransform: 'capitalize' }}>
                      {colorProfile.skin_undertone}
                    </span>
                  </div>

                  <div style={{ marginBottom: '1.5rem' }}>
                    <strong>Skin Depth:</strong>
                    <span style={{ marginLeft: '1rem', textTransform: 'capitalize' }}>
                      {colorProfile.skin_depth}
                    </span>
                  </div>

                  <div>
                    <h4 style={{ color: '#1a3a2f', marginBottom: '0.75rem' }}>Best Metals:</h4>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      {colorProfile.best_metals?.map((metal: string) => (
                        <span key={metal} style={{
                          padding: '0.4rem 0.8rem',
                          backgroundColor: '#c9a962',
                          color: '#fff',
                          borderRadius: '20px',
                          fontSize: '0.85rem',
                          textTransform: 'capitalize'
                        }}>
                          {metal.replace('_', ' ')}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Color Palette */}
                <div style={{
                  backgroundColor: '#fff',
                  padding: '2rem',
                  borderRadius: '12px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                }}>
                  <h3 style={{ color: '#1a3a2f', marginBottom: '1rem' }}>Your Best Colors</h3>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, 1fr)',
                    gap: '1rem'
                  }}>
                    {colorProfile.best_colors?.slice(0, 12).map((color: any) => (
                      <div key={color.hex} style={{ textAlign: 'center' }}>
                        <div style={{
                          width: '100%',
                          height: '80px',
                          backgroundColor: color.hex,
                          borderRadius: '8px',
                          border: '2px solid #1a3a2f',
                          marginBottom: '0.5rem'
                        }} />
                        <div style={{ fontSize: '0.75rem', color: '#666', textTransform: 'capitalize' }}>
                          {color.name.replace('_', ' ')}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div style={{
                backgroundColor: '#fff',
                padding: '3rem',
                borderRadius: '12px',
                textAlign: 'center',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
              }}>
                <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🎨</div>
                <h3 style={{ color: '#1a3a2f', marginBottom: '1rem' }}>Discover Your Colors</h3>
                <p style={{ color: '#666', marginBottom: '2rem' }}>
                  Upload a face photo to get your personal color palette and season analysis
                </p>
                <button style={{
                  padding: '1rem 2rem',
                  fontSize: '1.1rem',
                  backgroundColor: '#c9a962',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}>
                  Upload Photo
                </button>
                <p style={{ fontSize: '0.85rem', color: '#999', marginTop: '1rem' }}>
                  API endpoint ready at /api/ff/color-analysis
                </p>
              </div>
            )}
          </div>
        )}

        {/* Design Studio Tab */}
        {activeTab === 'design' && (
          <div>
            <h2 style={{
              fontSize: '2rem',
              color: '#1a3a2f',
              marginBottom: '1.5rem'
            }}>
              Custom Design Studio
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
              {/* Canvas */}
              <div style={{
                backgroundColor: '#fff',
                padding: '2rem',
                borderRadius: '12px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
              }}>
                {/* Design Canvas Placeholder */}
                <div style={{
                  backgroundColor: '#f8f8f8',
                  padding: '4rem 2rem',
                  borderRadius: '8px',
                  textAlign: 'center',
                  border: '2px dashed #ddd',
                  minHeight: '400px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>✂️</div>
                  <h3 style={{ color: '#666', marginBottom: '0.5rem' }}>Design Canvas Coming Soon</h3>
                  <p style={{ color: '#999', marginBottom: '0' }}>Interactive garment design tools will be available here</p>
                  <p style={{ color: '#999', fontSize: '0.875rem' }}>Draw custom patterns, add embellishments, choose fabrics</p>
                </div>
              </div>

              {/* Options Panel */}
              <div>
                <div style={{
                  backgroundColor: '#fff',
                  padding: '2rem',
                  borderRadius: '12px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  marginBottom: '1rem'
                }}>
                  <h3 style={{ color: '#1a3a2f', marginBottom: '1rem' }}>Design Options</h3>

                  <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', color: '#666' }}>
                      Garment Type
                    </label>
                    <select style={{
                      width: '100%',
                      padding: '0.75rem',
                      borderRadius: '6px',
                      border: '1px solid #ddd'
                    }}>
                      <option>Dress</option>
                      <option>Top/Blouse</option>
                      <option>Skirt</option>
                      <option>Pants</option>
                      <option>Jacket</option>
                    </select>
                  </div>

                  <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', color: '#666' }}>
                      Silhouette
                    </label>
                    <select style={{
                      width: '100%',
                      padding: '0.75rem',
                      borderRadius: '6px',
                      border: '1px solid #ddd'
                    }}>
                      <option>A-Line</option>
                      <option>Sheath</option>
                      <option>Fit & Flare</option>
                      <option>Wrap</option>
                      <option>Empire Waist</option>
                    </select>
                  </div>

                  <button style={{
                    width: '100%',
                    padding: '1rem',
                    fontSize: '1rem',
                    backgroundColor: '#c9a962',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    marginBottom: '0.5rem'
                  }}>
                    Save Design
                  </button>

                  <button style={{
                    width: '100%',
                    padding: '1rem',
                    fontSize: '1rem',
                    backgroundColor: '#1a3a2f',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer'
                  }}>
                    Order Custom Piece
                  </button>
                </div>

                {/* Fabric Selection */}
                <div style={{
                  backgroundColor: '#fff',
                  padding: '2rem',
                  borderRadius: '12px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                }}>
                  <h3 style={{ color: '#1a3a2f', marginBottom: '1rem' }}>Natural Fiber Fabrics</h3>
                  <div style={{ fontSize: '0.85rem', color: '#666', marginBottom: '1rem' }}>
                    All fabrics measured for healing frequencies
                  </div>

                  {['Irish Linen (5000 Hz)', 'Merino Wool (4800 Hz)', 'Silk Charmeuse (4500 Hz)'].map(fabric => (
                    <div key={fabric} style={{
                      padding: '0.75rem',
                      backgroundColor: '#f8f6f3',
                      borderRadius: '6px',
                      marginBottom: '0.5rem',
                      cursor: 'pointer',
                      border: '2px solid transparent'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.borderColor = '#c9a962'}
                    onMouseOut={(e) => e.currentTarget.style.borderColor = 'transparent'}
                    >
                      {fabric}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Virtual Closet Tab */}
        {activeTab === 'closet' && (
          <div>
            <h2 style={{
              fontSize: '2rem',
              color: '#1a3a2f',
              marginBottom: '1.5rem'
            }}>
              Virtual Closet
            </h2>

            <div style={{
              backgroundColor: '#fff',
              padding: '3rem',
              borderRadius: '12px',
              textAlign: 'center',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
            }}>
              <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>👗</div>
              <h3 style={{ color: '#1a3a2f', marginBottom: '1rem' }}>Your Virtual Closet</h3>
              <p style={{ color: '#666', marginBottom: '2rem' }}>
                Store all your clothing items (FF custom + existing wardrobe) with AI pairing suggestions
              </p>
              <button style={{
                padding: '1rem 2rem',
                fontSize: '1.1rem',
                backgroundColor: '#c9a962',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer'
              }}>
                Add Item to Closet
              </button>
              <p style={{ fontSize: '0.85rem', color: '#999', marginTop: '1rem' }}>
                API endpoint ready at /api/ff/closet
              </p>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer style={{
        marginTop: '4rem',
        padding: '2rem',
        backgroundColor: '#1a3a2f',
        color: '#e8dcc4',
        textAlign: 'center'
      }}>
        <p>Frequency & Form AI Style Studio</p>
        <p style={{ fontSize: '0.85rem', color: '#c9a962', marginTop: '0.5rem' }}>
          Powered by Natural Fiber Science • 100% Open Source • No Big Tech Dependencies
        </p>
      </footer>
    </div>
  );
}

// This file applies JSX fixes to App.js
// Can be deleted after verification

const fs = require('fs');
const path = require('path');

const appPath = path.join(__dirname, 'App.js');
let content = fs.readFileSync(appPath, 'utf-8');

// Fix 1: Remove duplicated conflict-details block in BookingRequest
// The duplicate appears as extra closing tags after the conflict details section
const duplicatePattern = `                              </div>
                          ))}
                        </div>
                      )}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}`;

const fixedPattern = `                              </div>
                          ))}
                        </div>
                      )}`;

if (content.includes(duplicatePattern)) {
  content = content.replace(duplicatePattern, fixedPattern);
  console.log('Fix 1 applied: Removed duplicated conflict-details block');
} else {
  console.log('Fix 1: Pattern not found (may already be fixed)');
}

// Fix 2: Fix broken closing tags at end of file
const brokenEnd = `      </span></span></span></span>\n    </div></div></div>\n  );\n}`;
const fixedEnd = `    </div>\n  );\n}`;

if (content.includes('</span></span></span></span>')) {
  content = content.replace(/\s*<\/span><\/span><\/span><\/span>\s*\n\s*<\/div><\/div><\/div>\s*\n\s*\);\s*\n\}/, '\n    </div>\n  );\n}');
  console.log('Fix 2 applied: Fixed broken closing tags');
} else {
  console.log('Fix 2: Pattern not found (may already be fixed)');
}

fs.writeFileSync(appPath, content, 'utf-8');
console.log('App.js has been fixed!');
console.log('File size:', content.length, 'bytes');

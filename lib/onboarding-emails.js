/**
 * Onboarding Emails Stub
 * Minimal implementation for bot server compatibility
 */

// Create stub functions for all onboarding email days
const createStubFunction = (dayNumber) => {
  return async (userId, userData) => {
    console.log(`[Stub] Onboarding day ${dayNumber} email for user ${userId}`);
    return { success: true, message: 'Stub email function' };
  };
};

module.exports = {
  // Days 2-30 onboarding emails
  sendOnboardingDay2: createStubFunction(2),
  sendOnboardingDay3: createStubFunction(3),
  sendOnboardingDay5: createStubFunction(5),
  sendOnboardingDay7: createStubFunction(7),
  sendOnboardingDay10: createStubFunction(10),
  sendOnboardingDay14: createStubFunction(14),
  sendOnboardingDay16: createStubFunction(16),
  sendOnboardingDay18: createStubFunction(18),
  sendOnboardingDay20: createStubFunction(20),
  sendOnboardingDay23: createStubFunction(23),
  sendOnboardingDay25: createStubFunction(25),
  sendOnboardingDay28: createStubFunction(28),
  sendOnboardingDay30: createStubFunction(30)
};

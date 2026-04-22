import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { motion } from "motion/react";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  Phone,
  MapPin,
  Calendar,
} from "lucide-react";
import Swal from "sweetalert2";
import { Navbar } from "../components/Navbar.jsx";
import { Footer } from "../components/Footer.jsx";
import { PhoneCountryPicker } from "../components/PhoneCountryPicker.jsx";
import { CountryPicker } from "../components/CountryPicker.jsx";
import logo from "@/assets/logo.jpeg";
import { userAPI } from "@/services/api.js";
import {
  getPasswordRequirements,
  validateEmail,
  validatePassword,
} from "@/app/utils/authValidation.js";
import {
  formatPhoneForStorage,
  PHONE_COUNTRIES,
  getPhoneCountry,
  sanitizePhoneInput,
  validatePhoneNumber,
} from "@/app/utils/phoneValidation.js";

export default function Register() {
  const today = new Date().toISOString().split("T")[0];
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phoneCountry: "IN",
    countryCode: "",
    phone: "",
    address: "",
    dateOfBirth: "",
    gender: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({
    fullName: "",
    email: "",
    password: "",
    phone: "",
    countryCode: "",
    address: "",
    dateOfBirth: "",
    gender: "",
    confirmPassword: "",
  });
  const navigate = useNavigate();

  const extractBackendMessage = (error) => {
    const data = error?.response?.data;
    if (!data) return error?.message || "An error occurred during registration. Please try again.";

    if (typeof data === "string") return data;
    if (typeof data?.message === "string") return data.message;
    if (typeof data?.error === "string") return data.error;
    if (typeof data?.details === "string") return data.details;

    if (Array.isArray(data?.errors) && data.errors.length > 0) {
      const firstError = data.errors[0];
      if (typeof firstError === "string") return firstError;
      if (typeof firstError?.message === "string") return firstError.message;
      if (typeof firstError?.defaultMessage === "string") return firstError.defaultMessage;
    }

    return "An error occurred during registration. Please try again.";
  };

  const validateFullName = (name) => {
    const trimmedName = name ? name.trim() : "";
    if (!trimmedName || trimmedName.length === 0) {
      return "Enter valid name";
    }
    if (trimmedName.length < 2) {
      return "Name must be at least 2 characters";
    }
    const regex = /^[A-Za-z ]+$/;
    if (!regex.test(trimmedName)) {
      return "Enter valid name";
    }
    return "";
  };

  const validatePhone = (phone) => {
    return validatePhoneNumber(phone, formData.phoneCountry);
  };

  const validateCountry = (countryCode) => {
    if (!countryCode) {
      return "Country is required";
    }

    const countryExists = PHONE_COUNTRIES.some(
      (country) => country.code === countryCode,
    );

    return countryExists ? "" : "Select a valid country";
  };

  const validateDateOfBirth = (dateOfBirth) => {
    if (!dateOfBirth) {
      return "Date of birth is required";
    }

    const birthDate = new Date(dateOfBirth);
    const currentDate = new Date();

    if (Number.isNaN(birthDate.getTime())) {
      return "Enter a valid date of birth";
    }

    if (birthDate > currentDate) {
      return "Date of birth cannot be in the future";
    }

    let age = currentDate.getFullYear() - birthDate.getFullYear();
    const monthDifference = currentDate.getMonth() - birthDate.getMonth();
    const dayDifference = currentDate.getDate() - birthDate.getDate();

    if (monthDifference < 0 || (monthDifference === 0 && dayDifference < 0)) {
      age -= 1;
    }

    if (age < 1 || age > 120) {
      return "Enter a valid date of birth";
    }

    return "";
  };

  const getAgeFromDateOfBirth = (dateOfBirth) => {
    const birthDate = new Date(dateOfBirth);
    const currentDate = new Date();

    let age = currentDate.getFullYear() - birthDate.getFullYear();
    const monthDifference = currentDate.getMonth() - birthDate.getMonth();
    const dayDifference = currentDate.getDate() - birthDate.getDate();

    if (monthDifference < 0 || (monthDifference === 0 && dayDifference < 0)) {
      age -= 1;
    }

    return age;
  };

  const validateAddress = (address) => {
    const trimmedAddress = address ? address.trim() : "";
    if (!trimmedAddress || trimmedAddress.length === 0) {
      return "Address is required";
    }
    if (trimmedAddress.length < 2) {
      return "Invalid address";
    }
    if (trimmedAddress.length > 500) {
      return "Invalid address";
    }
    // Check if only special characters
    const alphanumericAndCommaRegex = /^[a-zA-Z0-9,\s]+$/;
    if (!alphanumericAndCommaRegex.test(trimmedAddress)) {
      // Allow more special characters but check if it's just special chars
      const hasAlphanumeric = /[a-zA-Z0-9]/.test(trimmedAddress);
      if (!hasAlphanumeric) {
        return "Invalid address";
      }
    }
    return "";
  };

  const validateGender = (gender) => {
    if (!gender || gender === "") {
      return "Gender is required";
    }
    return "";
  };

  const passwordRequirements = getPasswordRequirements(formData.password);
  const phoneCountry = getPhoneCountry(formData.phoneCountry);
  const selectedCountry =
    PHONE_COUNTRIES.find((country) => country.code === formData.countryCode) ||
    null;

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate all fields
    const nameError = validateFullName(formData.fullName);
    const emailError = validateEmail(formData.email);
    const phoneError = validatePhone(formData.phone);
    const countryError = validateCountry(formData.countryCode);
    const addressError = validateAddress(formData.address);
    const dateOfBirthError = validateDateOfBirth(formData.dateOfBirth);
    const genderError = validateGender(formData.gender);
    const passwordError = validatePassword(formData.password);

    // Check confirm password
    let confirmPasswordError = "";
    if (!formData.confirmPassword || formData.confirmPassword.length === 0) {
      confirmPasswordError = "Please confirm your password";
    } else if (formData.password !== formData.confirmPassword) {
      confirmPasswordError = "Passwords do not match";
    }

    // Set all errors
    setErrors({
      fullName: nameError,
      email: emailError,
      phone: phoneError,
      countryCode: countryError,
      address: addressError,
      dateOfBirth: dateOfBirthError,
      gender: genderError,
      password: passwordError,
      confirmPassword: confirmPasswordError,
    });

    // If any validation error exists, return
    if (
      nameError ||
      emailError ||
      phoneError ||
      countryError ||
      addressError ||
      dateOfBirthError ||
      genderError ||
      passwordError ||
      confirmPasswordError
    ) {
      return;
    }

    setLoading(true);

    try {
      // Register user via API
      const response = await userAPI.register({
        fullName: formData.fullName.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formatPhoneForStorage(formData.phone, formData.phoneCountry) || null,
        country: selectedCountry?.label || null,
        address: formData.address.trim() || null,
        age: formData.dateOfBirth ? getAgeFromDateOfBirth(formData.dateOfBirth) : null,
        gender: formData.gender || null,
        password: formData.password,
        role: "USER",
      }, { suppressErrorAlert: true });

      Swal.fire({
        icon: "success",
        title: "Account created successfully",
        text: "Your account has been created. Please verify your email with OTP.",
        confirmButtonColor: "#2563EB",
        confirmButtonText: "Continue",
      }).then((result) => {
        if (result.isConfirmed) {
          navigate(
            "/verify-otp?email=" +
              encodeURIComponent(formData.email) +
              "&type=register",
          );
        }
      });
    } catch (error) {
      console.error("Registration error:", error);
      const backendMessage = extractBackendMessage(error);

      // Handle duplicate email error
      const lowerMessage = backendMessage.toLowerCase();
      const isDuplicateEmailError =
        error.response?.status === 409 ||
        (lowerMessage.includes("email") &&
          (lowerMessage.includes("already") || lowerMessage.includes("exist")));

      if (
        isDuplicateEmailError
      ) {
        setErrors({
          ...errors,
          email: backendMessage,
        });
      }

      Swal.fire({
        icon: "error",
        title: "Registration Failed",
        text: backendMessage,
        confirmButtonColor: "#2563EB",
        confirmButtonText: "OK",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Validate full name on change
    if (name === "fullName") {
      const error = validateFullName(value);
      setErrors({ ...errors, fullName: error });
    }

    // Validate email on change
    if (name === "email") {
      const error = validateEmail(value);
      setErrors({ ...errors, email: error });
    }

    // Validate phone on change
    if (name === "phone") {
      const numericValue = sanitizePhoneInput(value, formData.phoneCountry);
      const error = validatePhoneNumber(numericValue, formData.phoneCountry);
      setErrors({ ...errors, phone: error });
      setFormData({ ...formData, phone: numericValue });
      return;
    }

    if (name === "phoneCountry") {
      const numericValue = sanitizePhoneInput(formData.phone, value);
      const error = numericValue ? validatePhoneNumber(numericValue, value) : "";
      setErrors({ ...errors, phone: error });
      setFormData({ ...formData, phoneCountry: value, phone: numericValue });
      return;
    }

    if (name === "countryCode") {
      const error = validateCountry(value);
      setErrors({ ...errors, countryCode: error });
    }

    // Validate address on change
    if (name === "address") {
      const error = validateAddress(value);
      setErrors({ ...errors, address: error });
    }

    // Validate date of birth on change
    if (name === "dateOfBirth") {
      const error = validateDateOfBirth(value);
      setErrors({ ...errors, dateOfBirth: error });
    }

    // Validate gender on change
    if (name === "gender") {
      const error = validateGender(value);
      setErrors({ ...errors, gender: error });
    }

    // Validate password on change
    if (name === "password") {
      const error = validatePassword(value);
      setErrors({ ...errors, password: error });
    }

    // Validate confirm password on change
    if (name === "confirmPassword") {
      let error = "";
      if (value.length > 0 && formData.password !== value) {
        error = "Passwords do not match";
      }
      setErrors({ ...errors, confirmPassword: error });
    }

    setFormData({
      ...formData,
      [name]: value,
    });
  };

  return (
    <>
      <Navbar />

      <main className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-[#F1F5F9]">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md"
        >
          <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-10">
            {/* Logo */}
            <div className="text-center mb-8">
              <img
                src={logo}
                alt="RxIncredible"
                className="h-16 w-auto mx-auto mb-4"
              />
              <h2 className="text-3xl text-[#1E3A8A]">Create Account</h2>
              <p className="text-gray-600 mt-2">Join RxIncredible today</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Name */}
              <div>
                <label className="block text-gray-700 mb-2">Full Name</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (/^[A-Za-z\s]*$/.test(value)) {
                        handleChange(e);
                      }
                    }}
                    placeholder="Enter your full name"
                    className={`w-full pl-12 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-[#2563EB] focus:border-transparent transition-all duration-200 ${errors.fullName ? "border-red-500" : "border-gray-300"}`}
                    required
                  />
                </div>
                {errors.fullName && (
                  <p className="mt-1 text-sm text-red-500">{errors.fullName}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="block text-gray-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Enter your email"
                    autoComplete="email"
                    inputMode="email"
                    className={`w-full pl-12 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-[#2563EB] focus:border-transparent transition-all duration-200 ${errors.email ? "border-red-500" : "border-gray-300"}`}
                    required
                  />
                </div>
                {errors.email && (
                  <p className="mt-1 text-sm text-red-500">{errors.email}</p>
                )}
                {!errors.email && (
                  <p className="mt-1 text-xs text-gray-500">
                    Use a valid email like `name@gmail.com` or `name@company.in`.
                  </p>
                )}
              </div>

              {/* Phone */}
              <div>
                <label className="block text-gray-700 mb-2">Phone Number</label>
                <div className="flex gap-3">
                  <PhoneCountryPicker
                    value={formData.phoneCountry}
                    onChange={(countryCode) =>
                      handleChange({
                        target: { name: "phoneCountry", value: countryCode },
                      })
                    }
                  />
                  <div className="relative flex-1">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder={phoneCountry.example}
                      inputMode="numeric"
                      maxLength={phoneCountry.maxLength}
                      className={`w-full min-w-0 pl-12 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-[#2563EB] focus:border-transparent transition-all duration-200 ${errors.phone ? "border-red-500" : "border-gray-300"}`}
                      required
                    />
                  </div>
                </div>
                {errors.phone && (
                  <p className="mt-1 text-sm text-red-500">{errors.phone}</p>
                )}
              </div>

              {/* Address */}
              <div>
                <label className="block text-gray-700 mb-2">Address</label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="Enter your address"
                    maxLength={500}
                    className={`w-full pl-12 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-[#2563EB] focus:border-transparent transition-all duration-200 ${errors.address ? "border-red-500" : "border-gray-300"}`}
                    required
                  />
                </div>
                {errors.address && (
                  <p className="mt-1 text-sm text-red-500">{errors.address}</p>
                )}
              </div>

              {/* Country */}
              <div>
                <label className="block text-gray-700 mb-2">Country</label>
                <CountryPicker
                  value={formData.countryCode}
                  onChange={(countryCode) =>
                    handleChange({
                      target: { name: "countryCode", value: countryCode },
                    })
                  }
                />
                {errors.countryCode && (
                  <p className="mt-1 text-sm text-red-500">{errors.countryCode}</p>
                )}
              </div>

              {/* Date of Birth and Gender */}
              <div className="grid grid-cols-2 gap-4">
                {/* Date of Birth */}
                <div>
                  <label className="block text-gray-700 mb-2">Date of Birth</label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="date"
                      name="dateOfBirth"
                      value={formData.dateOfBirth}
                      onChange={handleChange}
                      max={today}
                      className={`w-full pl-12 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-[#2563EB] focus:border-transparent transition-all duration-200 ${errors.dateOfBirth ? "border-red-500" : "border-gray-300"}`}
                      required
                    />
                  </div>
                  {errors.dateOfBirth && (
                    <p className="mt-1 text-sm text-red-500">{errors.dateOfBirth}</p>
                  )}
                </div>

                {/* Gender */}
                <div>
                  <label className="block text-gray-700 mb-2">Gender</label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-[#2563EB] focus:border-transparent transition-all duration-200 ${errors.gender ? "border-red-500" : "border-gray-300"}`}
                    required
                  >
                    <option value="">Select</option>
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                  </select>
                  {errors.gender && (
                    <p className="mt-1 text-sm text-red-500">{errors.gender}</p>
                  )}
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-gray-700 mb-2">Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Create a password"
                    autoComplete="new-password"
                    maxLength={64}
                    className={`w-full pl-12 pr-12 py-3 border rounded-xl focus:ring-2 focus:ring-[#2563EB] focus:border-transparent transition-all duration-200 ${errors.password ? "border-red-500" : "border-gray-300"}`}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? (
                      <Eye className="w-5 h-5" />
                    ) : (
                      <EyeOff className="w-5 h-5" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-sm text-red-500">{errors.password}</p>
                )}
                <div className="mt-3 bg-gray-50 rounded-xl p-4 space-y-2">
                  <p className="text-sm font-medium text-gray-700">
                    Password rules
                  </p>
                  {passwordRequirements.map((requirement) => (
                    <div
                      key={requirement.key}
                      className="flex items-center text-sm"
                    >
                      {requirement.met ? (
                        <div className="w-4 h-4 rounded-full bg-green-500 mr-2" />
                      ) : (
                        <div className="w-4 h-4 border-2 border-gray-300 rounded-full mr-2" />
                      )}
                      <span
                        className={
                          requirement.met
                            ? "text-green-600"
                            : "text-gray-500"
                        }
                      >
                        {requirement.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-gray-700 mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Confirm your password"
                    autoComplete="new-password"
                    maxLength={64}
                    className={`w-full pl-12 pr-12 py-3 border rounded-xl focus:ring-2 focus:ring-[#2563EB] focus:border-transparent transition-all duration-200 ${errors.confirmPassword ? "border-red-500" : "border-gray-300"}`}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? (
                      <Eye className="w-5 h-5" />
                    ) : (
                      <EyeOff className="w-5 h-5" />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-500">
                    {errors.confirmPassword}
                  </p>
                )}
              </div>

              {/* Terms */}
              <div className="flex items-start">
                <input
                  type="checkbox"
                  className="w-4 h-4 mt-1 text-[#2563EB] rounded border-gray-300 focus:ring-[#2563EB]"
                  required
                />
                <span className="ml-2 text-sm text-gray-600">
                  I agree to the{" "}
                  <Link
                    to="/terms-of-service?from=/register"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#2563EB] hover:text-[#1E3A8A]"
                  >
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link
                    to="/privacy-policy?from=/register"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#2563EB] hover:text-[#1E3A8A]"
                  >
                    Privacy Policy
                  </Link>
                </span>
              </div>

              {/* Submit Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-[#1E3A8A] to-[#2563EB] text-white rounded-xl hover:shadow-lg transition-all duration-200 disabled:opacity-50"
              >
                {loading ? "Creating Account..." : "Create Account"}
              </motion.button>
            </form>

            {/* Login Link */}
            <p className="text-center mt-6 text-gray-600">
              Already have an account?{" "}
              <Link to="/login" className="text-[#2563EB] hover:text-[#1E3A8A]">
                Login
              </Link>
            </p>
          </div>
        </motion.div>
      </main>

      <Footer />
    </>
  );
}

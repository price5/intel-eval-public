import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { useUsernameValidation } from "@/hooks/useUsernameValidation";
import { toast } from "sonner";
import { EmailConfirmationDialog } from "./EmailConfirmationDialog";

const signUpSchema = z
  .object({
    fullName: z
      .string()
      .min(2, "Full name must be at least 2 characters")
      .max(100, "Full name must be less than 100 characters"),
    email: z
      .string()
      .email("Invalid email address")
      .max(255, "Email must be less than 255 characters"),
    password: z
      .string()
      .min(6, "Password must be at least 6 characters")
      .max(128, "Password must be less than 128 characters"),
    confirmPassword: z.string(),
    username: z
      .string()
      .min(3, "Username must be at least 3 characters")
      .max(20, "Username must be less than 20 characters"),
    college: z.string().min(1, "Please select a college"),
    usn: z
      .string()
      .min(1, "USN is required")
      .max(20, "USN must be less than 20 characters"),
    role: z.enum(["student", "instructor"]).refine((val) => val !== undefined, {
      message: "Please select a role",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type SignUpFormData = z.infer<typeof signUpSchema>;

export const SignUpForm = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [watchedUsername, setWatchedUsername] = useState("");
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [signupEmail, setSignupEmail] = useState("");
  const usernameValidation = useUsernameValidation(watchedUsername);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
  });

  const username = watch("username");

  React.useEffect(() => {
    setWatchedUsername(username || "");
  }, [username]);

  const onSubmit = async (data: SignUpFormData) => {
    if (!usernameValidation.isAvailable) {
      toast.error("Please choose an available username");
      return;
    }

    setIsLoading(true);

    try {
      // Determine correct redirect URL based on environment
      const getRedirectUrl = () => {
        const hostname = window.location.hostname;
        if (hostname.includes("vercel.app")) {
          return "https://intel-eval-hub.vercel.app/auth";
        } else {
          return "http://localhost:3000/auth";
        }
      };

      const { error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          emailRedirectTo: getRedirectUrl(),
          data: {
            full_name: data.fullName,
            username: data.username,
            college: data.college,
            usn: data.usn,
            role: data.role,
          },
        },
      });

      if (error) {
        if (error.message.includes("User already registered")) {
          toast.error(
            "An account with this email already exists. Please sign in instead.",
          );
        } else {
          toast.error(error.message);
        }
        return;
      }

      setSignupEmail(data.email);
      setShowConfirmDialog(true);
    } catch (error) {
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setValue("username", suggestion);
  };

  return (
    <>
      <EmailConfirmationDialog
        email={signupEmail}
        open={showConfirmDialog}
        onOpenChange={setShowConfirmDialog}
      />
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-4"
        style={{
          pointerEvents: showConfirmDialog ? "none" : "auto",
          opacity: showConfirmDialog ? 0.5 : 1,
        }}
      >
        <div className="space-y-2">
          <Label htmlFor="fullName">Full Name</Label>
          <Input
            id="fullName"
            type="text"
            placeholder="Enter your full name"
            {...register("fullName")}
            className={errors.fullName ? "border-destructive" : ""}
          />
          {errors.fullName && (
            <p className="text-sm text-destructive">
              {errors.fullName.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="Enter your email"
            {...register("email")}
            className={errors.email ? "border-destructive" : ""}
          />
          {errors.email && (
            <p className="text-sm text-destructive">{errors.email.message}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Enter password"
              {...register("password")}
              className={errors.password ? "border-destructive" : ""}
            />
            {errors.password && (
              <p className="text-sm text-destructive">
                {errors.password.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="Confirm password"
              {...register("confirmPassword")}
              className={errors.confirmPassword ? "border-destructive" : ""}
            />
            {errors.confirmPassword && (
              <p className="text-sm text-destructive">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="username">Username</Label>
          <Input
            id="username"
            type="text"
            placeholder="Choose a username"
            {...register("username")}
            className={
              errors.username || usernameValidation.isAvailable === false
                ? "border-destructive"
                : usernameValidation.isAvailable === true
                  ? "border-green-500"
                  : ""
            }
          />

          {/* Username validation feedback */}
          {watchedUsername && (
            <div className="space-y-2">
              <div className="text-xs space-y-1">
                <div className="flex items-center gap-2">
                  {usernameValidation.errors.includes(
                    "Must be at least 3 characters long",
                  ) ? (
                    <XCircle className="h-3 w-3 text-destructive" />
                  ) : (
                    <CheckCircle className="h-3 w-3 text-green-500" />
                  )}
                  <span
                    className={
                      usernameValidation.errors.includes(
                        "Must be at least 3 characters long",
                      )
                        ? "text-destructive"
                        : "text-green-600"
                    }
                  >
                    At least 3 characters
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {usernameValidation.errors.includes(
                    "Must start with a letter or underscore",
                  ) ? (
                    <XCircle className="h-3 w-3 text-destructive" />
                  ) : (
                    <CheckCircle className="h-3 w-3 text-green-500" />
                  )}
                  <span
                    className={
                      usernameValidation.errors.includes(
                        "Must start with a letter or underscore",
                      )
                        ? "text-destructive"
                        : "text-green-600"
                    }
                  >
                    Starts with letter or underscore
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {usernameValidation.errors.includes(
                    "Can only contain letters, numbers, and underscores",
                  ) ? (
                    <XCircle className="h-3 w-3 text-destructive" />
                  ) : (
                    <CheckCircle className="h-3 w-3 text-green-500" />
                  )}
                  <span
                    className={
                      usernameValidation.errors.includes(
                        "Can only contain letters, numbers, and underscores",
                      )
                        ? "text-destructive"
                        : "text-green-600"
                    }
                  >
                    Only letters, numbers, and underscores
                  </span>
                </div>

                {usernameValidation.isValid && (
                  <div className="flex items-center gap-2">
                    {usernameValidation.isChecking ? (
                      <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                    ) : usernameValidation.isAvailable ? (
                      <CheckCircle className="h-3 w-3 text-green-500" />
                    ) : (
                      <XCircle className="h-3 w-3 text-destructive" />
                    )}
                    <span
                      className={
                        usernameValidation.isAvailable
                          ? "text-green-600"
                          : "text-destructive"
                      }
                    >
                      {usernameValidation.isChecking
                        ? "Checking availability..."
                        : usernameValidation.isAvailable
                          ? "Available"
                          : "Already taken"}
                    </span>
                  </div>
                )}
              </div>

              {/* Username suggestions */}
              {!usernameValidation.isAvailable &&
                usernameValidation.suggestions.length > 0 && (
                  <Card className="p-3 bg-muted/50">
                    <p className="text-xs text-muted-foreground mb-2">
                      Suggestions:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {usernameValidation.suggestions.map((suggestion) => (
                        <Button
                          key={suggestion}
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-6 text-xs"
                          onClick={() => handleSuggestionClick(suggestion)}
                        >
                          {suggestion}
                        </Button>
                      ))}
                    </div>
                  </Card>
                )}
            </div>
          )}

          {errors.username && (
            <p className="text-sm text-destructive">
              {errors.username.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="college">College</Label>
          <Select onValueChange={(value) => setValue("college", value)}>
            <SelectTrigger
              className={errors.college ? "border-destructive" : ""}
            >
              <SelectValue placeholder="Select your college" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="New Horizon College of Engineering">
                New Horizon College of Engineering
              </SelectItem>
            </SelectContent>
          </Select>
          {errors.college && (
            <p className="text-sm text-destructive">{errors.college.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="usn">USN</Label>
          <Input
            id="usn"
            type="text"
            placeholder="Enter your USN"
            {...register("usn")}
            className={errors.usn ? "border-destructive" : ""}
          />
          {errors.usn && (
            <p className="text-sm text-destructive">{errors.usn.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="role">Role</Label>
          <Select
            onValueChange={(value: "student" | "instructor") =>
              setValue("role", value)
            }
          >
            <SelectTrigger className={errors.role ? "border-destructive" : ""}>
              <SelectValue placeholder="Select your role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="student">Student</SelectItem>
              <SelectItem value="instructor">Instructor</SelectItem>
            </SelectContent>
          </Select>
          {errors.role && (
            <p className="text-sm text-destructive">{errors.role.message}</p>
          )}
        </div>

        <Button
          type="submit"
          className="w-full"
          disabled={isLoading || !usernameValidation.isAvailable}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating Account...
            </>
          ) : (
            "Create Account"
          )}
        </Button>
      </form>
    </>
  );
};

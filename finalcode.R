library(readxl)
library(tidyverse) #data filter
library(nlme)
library(dplyr)
library(car)
library(MASS)
library(ggplot2)
# Load necessary libraries

library(car)
library(lmtest)
library(MASS)
library(gridExtra)
#Reading files in R

#reading data

biomarker=read_excel(file.choose())
covariates=read_excel(file.choose())
#merging dataframes

split_values <- do.call(rbind, strsplit(biomarker$Biomarker, "-"))
# Adding new columns to the data frame
biomarker$PatientID <- split_values[, 1]
biomarker$Weeks_Months <- split_values[, 2]

biomarker$PatientID<-as.character(biomarker$PatientID)
covariates$PatientID<-as.character(covariates$PatientID)

summary(biomarker)
#Merge
biom_cov<-merge(biomarker, covariates, by = "PatientID", all = TRUE)


library(dplyr)


# Assuming biomarkers and covariates are your two datasets
missing_in_biomarkers <- anti_join(covariates, biomarker, by = "PatientID")
missing_in_covariates <- anti_join(biomarker, covariates, by = "PatientID")

# Print missing PatientIDs
print("Patients missing in biomarkers:")
print(missing_in_biomarkers$PatientID)

print("Patients missing in covariates:")
print(missing_in_covariates$PatientID)




# Calculate standard deviation for all numeric columns
std_dev <- sapply(biomarker, function(x) if(is.numeric(x)) sd(x) else NA)

# Print result
print(std_dev)
# Select only biomarker columns (assuming they start from column 3 onwards)
biomarker_cols <- c("IL-8", "VEGF-A", "OPG", "TGF-beta-1", "IL-6", "CXCL9", "CXCL1", "IL-18", "CSF-1")

#finding outliers
# Define function to detect outliers using IQR
find_outliers_iqr <- function(data, biomarkers) {
  outlier_results <- lapply(biomarkers, function(biomarker) {
    Q1 <- quantile(data[[biomarker]], 0.25, na.rm = TRUE)
    Q3 <- quantile(data[[biomarker]], 0.75, na.rm = TRUE)
    IQR_value <- Q3 - Q1
    
    lower_bound <- Q1 - 1.5 * IQR_value
    upper_bound <- Q3 + 1.5 * IQR_value
    
    # Identify outliers
    outlier_indices <- which(data[[biomarker]] < lower_bound | data[[biomarker]] > upper_bound)
    
    # Extract patient IDs and outlier values
    if (length(outlier_indices) > 0) {
      return(data.frame(
        PatientID = data$PatientID[outlier_indices],
        Biomarker = biomarker,
        Outlier_Values = data[[biomarker]][outlier_indices]
      ))
    } else {
      return(NULL)  # Return NULL if no outliers
    }
  })
  
  # Combine into a single dataframe
  outlier_df <- do.call(rbind, outlier_results)
  return(outlier_df)
}

outliers_df <- find_outliers_iqr(biomarker, biomarker_cols)
# Apply function to find outliers

# Count the number of outliers per biomarker
outliers_count <- outliers_df %>%
  group_by(Biomarker) %>%
  summarise(Count = n())

# Print result
print(outliers_count)
covariates$`Sex (1=male, 2=female)`<-as.factor(covariates$`Sex (1=male, 2=female)`)
covariates$`Smoker (1=yes, 2=no)`<-as.factor(covariates$`Smoker (1=yes, 2=no)`)
summary(covariates)
names(covariates)
cov_cols<-c("VAS-at-inclusion","Vas-12months","Age")

#Finding outliers in Covariates
cov_ol<-find_outliers_iqr(covariates, cov_cols)
sd(covariates$Age)
sd(covariates$`VAS-at-inclusion`)
sd(covariates$`Vas-12months`, na.rm = TRUE)

#Identifying the patients for whom all three entries are not present 
subset_df <- biomarker %>%
  group_by(PatientID) %>%
  filter(n() < 3) %>%
  ungroup()
############################################################################################################################
# Question 1
# Filter data for Week 0
week0_data <- biom_cov %>% filter(Weeks_Months == "0weeks")

# Check structure of VAS column
str(week0_data$VAS_Inclusion)
week0_data <- week0_data %>% mutate(VAS_Group = ifelse(`VAS-at-inclusion` >= 5, "High_VAS", "Low_VAS"))

summary(week0_data)
# Select only biomarker columns (assuming they start from column 3 onwards)
cols <- c("IL-8", "VEGF-A", "OPG", "TGF-beta-1", "IL-6", "CXCL9", "CXCL1", "IL-18", "CSF-1", "VAS-at-inclusion")
# Create histograms with density lines for each variable
histograms <- lapply(cols, function(var) {
  ggplot(week0_data, aes(x = .data[[var]])) + 
    geom_histogram(aes(y = ..density..), binwidth = 0.1, fill = "skyblue", color = "black", alpha = 0.2) +
    geom_density(color = "red", size = 0.5) +  # Add density line in red
    theme_minimal() + 
    labs(title = paste("Histogram & Density of", var), x = var, y = "Density") +
    theme(plot.title = element_text(size = 8, face = "bold"))
})
grid.arrange(grobs = histograms, ncol = 2)

#Boxplots
# Generate all boxplots
boxplot_list <- lapply(cols, function(biomarker) {
  ggplot(week0_data, aes(x = VAS_Group, y = .data[[biomarker]], fill = VAS_Group)) +
    geom_boxplot(alpha = 0.6, outlier.color = "red", outlier.shape = 16) +
    labs(title = paste("Boxplot of", biomarker),
         x = "VAS Group",
         y = biomarker) +
    theme_minimal() +
    scale_fill_manual(values = c("blue", "orange")) 
})

# Arrange all plots in a 3x3 grid
grid.arrange(grobs = boxplot_list, ncol = 2)
# Testing Normality

biomarker_cols <- c("IL-8", "VEGF-A", "OPG", "TGF-beta-1", "IL-6", "CXCL9", "CXCL1", "IL-18", "CSF-1")
#In Shapiro-Wilk test H0: The data is normal H1: Data is not normal. At alpha=0.05 if p>alpha we fail to reject H0
# Run Shapiro-Wilk test for each biomarker and store results
shapiro_results <- lapply(biomarker_cols, function(biomarker) {
  values <- week0_data[[biomarker]]  # Extract actual numeric data
  test <- shapiro.test(values)
  data.frame(
    Biomarker = biomarker,
    avg = mean(values, na.rm = TRUE),  # Compute mean, ignoring NAs
    stdev = sd(values, na.rm = TRUE),  # Compute standard deviation, ignoring NAs
    P_Value = round(test$p.value,4),
    Significant = ifelse(test$p.value < 0.01, "not normal", "normal")  
  )
})

# Combine results into a single dataframe
shapiro_results_df <- do.call(rbind, shapiro_results)
# Checking for equal variances 

# Levene's test for VEGF-A
leveneTest(week0_data$`VEGF-A`, group = week0_data$VAS_Group)

# Levene's test for IL-18
leveneTest(week0_data$`IL-18`, group = week0_data$VAS_Group)

#Equal Variances are present therefore T-TEST can be used
# Lists of normal and non-normal biomarkers
normal_biomarkers <- c("VEGF-A", "IL-18")
not_normal_biomarkers <- c("IL-8", "OPG", "TGF-beta-1", "IL-6", "CXCL9", "CXCL1", "CSF-1")

# Set significance level for Bonferroni correction
alpha <- 0.05
alpha_adjusted <- alpha / (length(normal_biomarkers) + length(not_normal_biomarkers)) # Bonferroni correction for all tests

# Perform t-tests for normal biomarkers
t_test_results <- lapply(normal_biomarkers, function(biomarker) {
  test <- t.test(week0_data[[biomarker]] ~ week0_data$VAS_Group, conf.level = 0.95)
  data.frame(
    Biomarker = biomarker,
    Test_Performed = "T-test",
    P_Value = test$p.value,
    Significant = ifelse(test$p.value < alpha, "Yes", "No")
  )
})
t_test_results <- do.call(rbind, t_test_results)

# Perform Mann-Whitney U test for non-normal biomarkers
wilcoxon_results <- lapply(not_normal_biomarkers, function(biomarker) {
  test <- wilcox.test(week0_data[[biomarker]] ~ week0_data$VAS_Group)
  data.frame(
    Biomarker = biomarker,
    Test_Performed = "Mann-Whitney U test",
    P_Value = test$p.value,
    Significant = ifelse(test$p.value < alpha, "Yes", "No")
  )
})
wilcoxon_results <- do.call(rbind, wilcoxon_results)

# Combine both results
all_results <- rbind(t_test_results, wilcoxon_results)

# Apply Bonferroni correction
all_results$Adjusted_P_Value <- p.adjust(all_results$P_Value, method = "bonferroni")
all_results$Significant_Bonferroni <- ifelse(all_results$Adjusted_P_Value < alpha, "Yes", "No")

#lets check the boxplots

# Generate all boxplots
boxplot_list <- lapply(biomarker_cols, function(biomarker) {
  ggplot(week0_data, aes(x = VAS_Group, y = .data[[biomarker]], fill = VAS_Group)) +
    geom_boxplot(alpha = 0.6, outlier.color = "red", outlier.shape = 16) +
    labs(title = paste("Boxplot of", biomarker),
         x = "VAS Group",
         y = biomarker) +
    theme_minimal() +
    scale_fill_manual(values = c("blue", "orange")) 
})

# Arrange all plots in a 3x3 grid
grid.arrange(grobs = boxplot_list, ncol = 3)
# Question 2 Regression Analysis

#Let's check for linearity
lineplot_list <- lapply(biomarker_cols, function(biomarker) {
  ggplot(week0_data, aes(x = `Vas-12months`, y = .data[[biomarker]])) +
    geom_point(alpha = 0.5, color = "blue") +  # Scatter points
    geom_smooth(method = "lm", color = "red", se = TRUE) +  # Linear regression line
    labs(title = paste("VAS vs", biomarker),
         x = "VAS Score",
         y = biomarker) +
    theme_minimal()
})
grid.arrange(grobs = lineplot_list, ncol = 3)



week0_data<-na.omit(week0_data)

bc<-c("Vas-12months","IL-8", "VEGF-A", "OPG", "TGF-beta-1", "IL-6", "CXCL9", "CXCL1", "IL-18", "CSF-1","Age","Sex (1=male, 2=female)","Smoker (1=yes, 2=no)")
regression_data<-week0_data[,bc]

regression_data <- regression_data %>%
  rename_with(~ gsub("-", "_", .))
regression_data
# Split into 80% training and 20% testing
sample_size <- floor(0.8 * nrow(regression_data))
train_indices <- sample(seq_len(nrow(regression_data)), size = sample_size)
regression_data$`Sex (1=male, 2=female)`<-as.factor(regression_data$`Sex (1=male, 2=female)`)

regression_data$`Smoker (1=yes, 2=no)`<-as.factor(regression_data$`Smoker (1=yes, 2=no)`)
train_data <- regression_data[train_indices, ]
test_data  <- regression_data[-train_indices, ]

# Fit multiple linear regression model
model <- lm(`Vas_12months` ~ ., data = train_data)

# Display model summary
summary(model)


library(broom)
par(mfrow = c(2, 2)) # Arrange plots in a grid
plot(model) # This automatically gives Residuals vs Fitted, Q-Q plot, Scale-Location, and Cook's Distance plots
model_diagnostics <- augment(model)
model_diagnostics
p1 <- ggplot(model_diagnostics, aes(.fitted, .resid)) +
  geom_point() +
  geom_smooth(method = "loess", color = "red", se = FALSE) +
  labs(title = "Residuals vs Fitted", x = "Fitted Values", y = "Residuals") +
  theme_minimal()

p2 <- ggplot(model_diagnostics, aes(sample = .std.resid)) +
  stat_qq() +
  stat_qq_line(color = "red") +
  labs(title = "Normal Q-Q Plot") +
  theme_minimal()

p3 <- ggplot(model_diagnostics, aes(.fitted, sqrt(abs(.std.resid)))) +
  geom_point() +
  geom_smooth(method = "loess", color = "red", se = FALSE) +
  labs(title = "Scale-Location Plot", x = "Fitted Values", y = "???|Standardized Residuals|") +
  theme_minimal()

p4 <- ggplot(model_diagnostics, aes(.hat, .std.resid)) +
  geom_point() +
  geom_smooth(method = "loess", color = "red", se = FALSE) +
  labs(title = "Residuals vs Leverage", x = "Leverage", y = "Standardized Residuals") +
  theme_minimal()

# Arrange all plots in a grid
grid.arrange(p1, p2, p3, p4, nrow = 2, ncol = 2)


#Predicting using the rest of the data
# Predict on test data
predictions <- predict(model, newdata = test_data)
#checking if indices match
identical(rownames(test_data), names(predictions))
#comparing actual and predicted
# Create a data frame to compare actual vs. predicted values
comparison_df <- data.frame(Actual = test_data$Vas_12months, Predicted = predictions)

# Print the first few rows
head(comparison_df)


# Evaluate model performance
mse <- mean((test_data$Vas_12months - predictions)^2)  # Mean Squared Error
rmse <- sqrt(mse)  # Root Mean Squared Error
r2 <- cor(test_data$Vas_12months, predictions)^2  # R-squared

n <- nrow(test_data)  # Number of observations in test data
p <- length(coef(model)) - 1  # Number of predictors
r2_adj_test <- 1 - ((1 - r2) * (n - 1) / (n - p - 1))

cat("Adjusted R-squared for Test Data:", r2_adj_test, "\n")
# Create a data frame for model performance metrics
performance_df <- data.frame(
  Metric = c("Mean Squared Error (MSE)", "Root Mean Squared Error (RMSE)", "R-squared (R²)", "Adjusted R-Squared"),
  Value = c(mse, rmse, r2,r2_adj_test)
)


# Visualize actual vs predicted values

ggplot(data.frame(Actual = test_data$Vas_12months, Predicted = predictions), aes(x = Actual, y = Predicted)) +
  geom_point(size=3) +
  geom_abline(slope = 1, intercept = 0, color = "red") +
  theme_minimal() +
  labs(title = "Actual vs Predicted Values", x = "Actual", y = "Predicted")

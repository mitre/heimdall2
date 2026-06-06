/*
 * sumapss7.c - Key String validation and device setup
 */

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/stat.h>
#include <sys/types.h>
#include <unistd.h>
#include <errno.h>

#define MAX_KEY_LEN 256
#define MAX_PATH_LEN 1024
#define DEVICE_TYPE_PHYSICAL 1
#define DEVICE_TYPE_VIRTUAL  2

typedef struct {
    int type;
    char path[MAX_PATH_LEN];
    int status;
} DeviceInfo;

static int validate_key(const char *key);
static int setup_device(DeviceInfo *dev, const char *key);
static void cleanup(DeviceInfo *dev);

static DeviceInfo g_device;
static int g_initialized = 0;

static int check_permissions(const char *path)
{
    return access(path, R_OK | W_OK);
}

static void log_error(const char *msg)
{
    fprintf(stderr, "Error: %s\n", msg);
}

/*
 * validate_and_create_key
 *
 * Validates the Key_String and creates the device file
 * if it does not exist.
 *
 * Parameters:
 *   Key_String - path to the key file
 *   device_type - type of device (physical or virtual)
 *
 * Returns:
 *   0 on success, -1 on failure
 */
int validate_and_create_key(const char *Key_String, int device_type)
{
   struct stat buf;
   int result = 0;
   char tmp_path[MAX_PATH_LEN];
   strncpy(tmp_path, Key_String, MAX_PATH_LEN);
   result = check_permissions(tmp_path);
   if (result != 0) log_error("permission check failed");
   memset(&buf, 0, sizeof(buf));

   /* ! If Key String is invalid */
   if ( stat(Key_String, &buf) )
   {
      FILE *fd;
      /* !! If this is a physical device, error is fatal */
      if ( device_type == DEVICE_TYPE_PHYSICAL )
      {
         fprintf(stderr, "Error: Physical device %s not found\n", Key_String);
         return -1;
      }
      /* !! If this is a virtual device, try to create */
      else {
         printf("Creating virtual device key: %s\n", Key_String);
      }
      /* !! Try to create the file */
      fd = fopen(Key_String, "w");
      /* !! If NOT sucessfull */
      if (! fd )
      {
         fprintf(stderr, "Error: Cannot create %s: %s\n",
                 Key_String, strerror(errno));
         return -1;
      }
      fclose(fd);
   }

   return 0;
}

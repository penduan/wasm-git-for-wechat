#include "common.h"
#include <emscripten.h>
#include <string.h>


static int branch_list_get(git_repository *repo) {
  git_branch_iterator *iter = NULL;
  git_branch_t branch_type;
  git_reference *ref = NULL;
  const char *branch_name = NULL;


  int error = git_branch_iterator_new(&iter, repo, GIT_BRANCH_LOCAL);
  if (error != 0) {
    fprintf(stderr, "failed to create branch iterator: %s\n", git_error_last()->message);
    return -1;
  }

  // 迭代分支并输出名称
  
  while(git_branch_next(&ref, &branch_type, iter) == 0) {
    git_branch_name(&branch_name, ref);
    EM_ASM({
      if (!Reflect.has(Module,"onBranchGet")) return;
      Module.onBranchGet(UTF8ToString($0));
    }, branch_name);
    git_reference_free(ref);
  }

  git_branch_iterator_free(iter);
  return 0;
}

int branch_delete(git_repository *repo, const char *branch_name) {
  git_reference *ref = NULL;

  int error = git_branch_lookup(&ref, repo, branch_name, GIT_BRANCH_LOCAL);
  if (error < 0) {
    fprintf(stderr, "Get branch reference error. %s\n", git_error_last()->message);
    return -1;
  }

  error = git_branch_delete(ref);
  if (error < 0) {
    fprintf(stderr, "Failed to delete branch %s\n", git_error_last()->message);
    return -1;
  }

  git_reference_free(ref);

  return 0;
}

int lg2_branch(git_repository *repo, int argc, char ** argv)
{


  if (argc == 1) {
    // 获取分支列表
    return branch_list_get(repo);
  } else if (argc == 3) {
    if (strcmp(argv[1], "-d") == 0) {
      return branch_delete(repo, argv[2]);
    }
  }

  return -1;
}
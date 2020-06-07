require 'atk_toolbox'

FS.chdir __dir__

def hide_git_and_gitignore
    all_git_files = Dir.glob('**/.*').select{|each| FS.basename(each) =~ /^(\.gitignore|\.git)$/ }
    for each in all_git_files
        *parents, filename, file_ext = FS.path_pieces(each)
        FS.rename(each, new_name: ".was_"+filename.sub(/\./,"")+file_ext)
    end
end

def save_file_tree_structure_to_file()
    FS.write(Dir.glob('**/*').join("\n"), to: "./file_structure.txt")
end

save_file_tree_structure_to_file()
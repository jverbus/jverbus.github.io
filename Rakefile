require "rake"
require "time"
require "fileutils"

SOURCE = "."
POSTS_DIR = File.join(SOURCE, "_posts")
POST_EXT = "md"

def prompt(message, valid_options = nil)
  if valid_options
    answer = nil
    until valid_options.include?(answer)
      print "#{message} #{valid_options.join('/')} "
      answer = STDIN.gets&.chomp
    end
    answer
  else
    print "#{message} "
    STDIN.gets&.chomp
  end
end

# Usage: rake post title="A Title" [date="2012-02-09"] [tags=[tag1,tag2]] [categories=[cat1,cat2]]
desc "Begin a new post in #{POSTS_DIR}"
task :post do
  abort("rake aborted: '#{POSTS_DIR}' directory not found.") unless FileTest.directory?(POSTS_DIR)

  title = ENV["title"] || "new-post"
  tags = ENV["tags"] || "[]"
  categories = ENV["categories"] || "[]"

  slug = title.downcase.strip.gsub(" ", "-").gsub(/[^\w-]/, "")

  begin
    date = (ENV["date"] ? Time.parse(ENV["date"]) : Time.now).strftime("%Y-%m-%d")
  rescue StandardError
    puts "Error - date format must be YYYY-MM-DD, please check you typed it correctly!"
    exit(-1)
  end

  filename = File.join(POSTS_DIR, "#{date}-#{slug}.#{POST_EXT}")
  if File.exist?(filename)
    overwrite = prompt("#{filename} already exists. Do you want to overwrite?", %w[y n])
    abort("rake aborted!") if overwrite == "n"
  end

  puts "Creating new post: #{filename}"
  File.open(filename, "w") do |post|
    post.puts "---"
    post.puts "layout: post"
    post.puts "title: \"#{title.gsub(/-/, ' ')}\""
    post.puts "description: \"\""
    post.puts "og_image: \"\""
    post.puts "og_image_width: 1200"
    post.puts "og_image_height: 630"
    post.puts "categories: #{categories}"
    post.puts "tags: #{tags}"
    post.puts "---"
  end
end

# Usage: rake page name="about.md"
# You can also specify a sub-directory path.
# If you don't specify a file extension we create an index.md at the path specified.
desc "Create a new page."
task :page do
  name = ENV["name"] || "new-page.md"
  filename = File.join(SOURCE, name)
  filename = File.join(filename, "index.md") if File.extname(filename).empty?

  title = File.basename(filename, File.extname(filename))
             .gsub(/[\W\_]/, " ")
             .gsub(/\b\w/, &:upcase)

  if File.exist?(filename)
    overwrite = prompt("#{filename} already exists. Do you want to overwrite?", %w[y n])
    abort("rake aborted!") if overwrite == "n"
  end

  FileUtils.mkdir_p(File.dirname(filename))
  puts "Creating new page: #{filename}"

  File.open(filename, "w") do |page|
    page.puts "---"
    page.puts "layout: page"
    page.puts "title: \"#{title}\""
    page.puts "description: \"\""
    page.puts "---"
  end
end

desc "Launch preview environment"
task :preview do
  system "bundle exec jekyll serve -w"
end
